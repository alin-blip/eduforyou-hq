import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

type GhlContact = {
  id: string;
  firstName?: string;
  lastName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  assignedTo?: string;
  dateAdded?: string;
  dateUpdated?: string;
};

type GhlOpportunity = {
  id: string;
  contactId: string;
  pipelineId: string;
  pipelineStageId: string;
  status: string;
  monetaryValue?: number;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Pipeline = {
  id: string;
  name: string;
  stages: { id: string; name: string }[];
};

async function ghlFetch(path: string, apiKey: string, params: Record<string, string> = {}) {
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
    throw new Error(`GHL ${path} ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
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

  try {
    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return new Response(
        JSON.stringify({ error: "GHL secrets not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // 1) Fetch pipelines (for stage name resolution)
    const pipelinesRes = await ghlFetch(`/opportunities/pipelines`, GHL_API_KEY, {
      locationId: GHL_LOCATION_ID,
    });
    const pipelines: Pipeline[] = pipelinesRes?.pipelines ?? [];
    const stageMap = new Map<string, { pipelineId: string; pipelineName: string; stageName: string }>();
    for (const p of pipelines) {
      for (const s of p.stages ?? []) {
        stageMap.set(s.id, { pipelineId: p.id, pipelineName: p.name, stageName: s.name });
      }
    }

    // 2) Fetch contacts (paginated, limit to first 200 for safety)
    let contacts: GhlContact[] = [];
    let page = 1;
    const limit = 100;
    while (page <= 2) {
      const data = await ghlFetch(`/contacts/`, GHL_API_KEY, {
        locationId: GHL_LOCATION_ID,
        limit: String(limit),
        page: String(page),
      });
      const batch: GhlContact[] = data?.contacts ?? [];
      contacts = contacts.concat(batch);
      if (batch.length < limit) break;
      page += 1;
    }

    // 3) Fetch opportunities
    let opportunities: GhlOpportunity[] = [];
    try {
      const oppData = await ghlFetch(`/opportunities/search`, GHL_API_KEY, {
        location_id: GHL_LOCATION_ID,
        limit: "100",
      });
      opportunities = oppData?.opportunities ?? [];
    } catch (_) {
      // Opportunities endpoint may not be enabled; continue with contacts only
      opportunities = [];
    }
    const oppByContact = new Map<string, GhlOpportunity>();
    for (const o of opportunities) {
      const existing = oppByContact.get(o.contactId);
      if (!existing || (o.updatedAt ?? "") > (existing.updatedAt ?? "")) {
        oppByContact.set(o.contactId, o);
      }
    }

    // 4) Upsert into ghl_leads
    const rows = contacts.map((c) => {
      const opp = oppByContact.get(c.id);
      const stageInfo = opp ? stageMap.get(opp.pipelineStageId) : undefined;
      const joined = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
      const fullName = c.contactName ?? (joined.length > 0 ? joined : null);
      return {
        ghl_contact_id: c.id,
        ghl_opportunity_id: opp?.id ?? null,
        full_name: fullName,
        email: c.email ?? null,
        phone: c.phone ?? null,
        source: c.source ?? null,
        pipeline_id: opp?.pipelineId ?? null,
        pipeline_name: stageInfo?.pipelineName ?? null,
        stage_id: opp?.pipelineStageId ?? null,
        stage_name: stageInfo?.stageName ?? null,
        status: opp?.status ?? "lead",
        monetary_value: opp?.monetaryValue ?? 0,
        currency: "EUR",
        tags: c.tags ?? [],
        assigned_to: c.assignedTo ?? null,
        ghl_created_at: c.dateAdded ?? null,
        ghl_updated_at: c.dateUpdated ?? null,
        raw_payload: { contact: c, opportunity: opp ?? null },
        synced_at: new Date().toISOString(),
      };
    });

    let upserted = 0;
    if (rows.length > 0) {
      const { error: upErr, count } = await admin
        .from("ghl_leads")
        .upsert(rows, { onConflict: "ghl_contact_id", count: "exact" });
      if (upErr) throw upErr;
      upserted = count ?? rows.length;
    }

    const duration = Date.now() - started;
    await admin.from("ghl_sync_log").insert({
      triggered_by: userId,
      contacts_synced: contacts.length,
      opportunities_synced: opportunities.length,
      success: true,
      duration_ms: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
        contacts: contacts.length,
        opportunities: opportunities.length,
        upserted,
        pipelines: pipelines.length,
        duration_ms: duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      // ignore log failure
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
