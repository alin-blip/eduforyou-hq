import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const MAX_OPPORTUNITIES = 20000;
const PAGE_SIZE = 100;
const UPSERT_CHUNK = 500;
const NOTES_CONCURRENCY = 6;
const DEAD_STAGES = new Set([
  "🛑 Refuz",
  "👎Prezent Picat",
  "❌ Aplicant Direct",
  "❌ File in Process Picat",
  "🚀 Finantare Aprobata",
]);

type GhlOpportunity = {
  id: string;
  contactId?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  status?: string;
  monetaryValue?: number;
  name?: string;
  source?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
  contact?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    tags?: string[];
  };
};

type Pipeline = {
  id: string;
  name: string;
  stages?: { id: string; name: string; position?: number }[];
};

async function ghlFetch(
  path: string,
  apiKey: string,
  params: Record<string, string> = {},
) {
  const url = new URL(`${GHL_API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: GHL_API_VERSION,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL ${path} ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

function pickMasterPipeline(pipelines: Pipeline[], explicitId?: string | null): Pipeline | null {
  if (!pipelines.length) return null;
  if (explicitId) {
    const found = pipelines.find((p) => p.id === explicitId);
    if (found) return found;
  }
  // Prefer name containing both "lead" and "master"
  const byName = pipelines.find((p) => {
    const n = (p.name ?? "").toLowerCase();
    return n.includes("lead") && n.includes("master");
  });
  if (byName) return byName;
  // Fallback: first pipeline whose name starts with "lead"
  const startsLead = pipelines.find((p) => (p.name ?? "").toLowerCase().startsWith("lead"));
  if (startsLead) return startsLead;
  return pipelines[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const started = Date.now();
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GHL_API_KEY = Deno.env.get("GHL_API_KEY");
  const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID");
  const GHL_MASTER_PIPELINE_ID = Deno.env.get("GHL_MASTER_PIPELINE_ID");

  try {
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return new Response(
        JSON.stringify({ error: "GHL secrets not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // AuthZ
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: uErr } = await userClient.auth.getUser();
    if (uErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: hasRole } = await userClient.rpc("has_any_role", {
      _user_id: userRes.user.id,
      _roles: ["ceo", "executive", "manager"],
    });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userRes.user.id;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Pipelines
    const pipelinesRes = await ghlFetch(`/opportunities/pipelines`, GHL_API_KEY, {
      locationId: GHL_LOCATION_ID,
    });
    const pipelines: Pipeline[] = pipelinesRes?.pipelines ?? [];
    const master = pickMasterPipeline(pipelines, GHL_MASTER_PIPELINE_ID);
    if (!master) {
      throw new Error("No pipelines found in GHL location");
    }

    const stageMap = new Map<string, { name: string; position?: number }>();
    for (const s of master.stages ?? []) {
      stageMap.set(s.id, { name: s.name, position: s.position });
    }

    // 2) Paginate opportunities for the master pipeline only (cursor-based)
    const opportunities: GhlOpportunity[] = [];
    let pagesFetched = 0;
    let startAfter: string | null = null;
    let startAfterId: string | null = null;
    while (opportunities.length < MAX_OPPORTUNITIES) {
      const params: Record<string, string> = {
        location_id: GHL_LOCATION_ID,
        pipeline_id: master.id,
        limit: String(PAGE_SIZE),
      };
      if (startAfter) params.startAfter = startAfter;
      if (startAfterId) params.startAfterId = startAfterId;

      const data = await ghlFetch(`/opportunities/search`, GHL_API_KEY, params);
      const batch: GhlOpportunity[] = data?.opportunities ?? [];
      pagesFetched += 1;
      if (batch.length === 0) break;
      opportunities.push(...batch);

      const meta = data?.meta ?? {};
      const nextStartAfter =
        meta.startAfter != null ? String(meta.startAfter) : null;
      const nextStartAfterId = meta.startAfterId ?? null;

      // Stop if no cursor or cursor didn't advance
      if (!nextStartAfterId || nextStartAfterId === startAfterId) break;
      if (batch.length < PAGE_SIZE) break;

      startAfter = nextStartAfter;
      startAfterId = nextStartAfterId;

      // Safety: hard cap on pages too
      if (pagesFetched > 250) break;
    }

    // 3) Build rows
    const nowIso = new Date().toISOString();
    const rows = opportunities.map((o) => {
      const stage = o.pipelineStageId ? stageMap.get(o.pipelineStageId) : undefined;
      const c = o.contact ?? {};
      const joined = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
      const fullName = c.name ?? (joined.length > 0 ? joined : null);
      return {
        ghl_opportunity_id: o.id,
        ghl_contact_id: o.contactId ?? c.id ?? `opp:${o.id}`,
        full_name: fullName,
        email: c.email ?? null,
        phone: c.phone ?? null,
        source: o.source ?? null,
        pipeline_id: o.pipelineId ?? master.id,
        pipeline_name: master.name,
        stage_id: o.pipelineStageId ?? null,
        stage_name: stage?.name ?? null,
        status: o.status ?? "open",
        monetary_value: o.monetaryValue ?? 0,
        currency: "EUR",
        tags: c.tags ?? [],
        assigned_to: o.assignedTo ?? null,
        ghl_created_at: o.createdAt ?? null,
        ghl_updated_at: o.updatedAt ?? null,
        raw_payload: { opportunity: o },
        synced_at: nowIso,
      };
    });

    // 4) Chunked upsert
    let upserted = 0;
    for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
      const slice = rows.slice(i, i + UPSERT_CHUNK);
      const { error: upErr, count } = await admin
        .from("ghl_leads")
        .upsert(slice, { onConflict: "ghl_opportunity_id", count: "exact" });
      if (upErr) throw upErr;
      upserted += count ?? slice.length;
    }

    // 5) Cache pipelines
    const pipelineRows = pipelines.map((p) => ({
      id: p.id,
      name: p.name,
      is_master: p.id === master.id,
      stages: (p.stages ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        position: s.position ?? 0,
      })),
      total_opportunities: p.id === master.id ? opportunities.length : 0,
      synced_at: nowIso,
    }));
    if (pipelineRows.length > 0) {
      await admin.from("ghl_pipelines").upsert(pipelineRows, { onConflict: "id" });
    }

    const duration = Date.now() - started;
    await admin.from("ghl_sync_log").insert({
      triggered_by: userId,
      contacts_synced: 0,
      opportunities_synced: opportunities.length,
      success: true,
      duration_ms: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        pipeline_id: master.id,
        pipeline_name: master.name,
        total_opportunities: opportunities.length,
        upserted,
        pages_fetched: pagesFetched,
        pipelines: pipelines.length,
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    try {
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      await admin.from("ghl_sync_log").insert({
        success: false,
        error_message: message,
        duration_ms: Date.now() - started,
      });
    } catch (_) {
      // ignore
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
