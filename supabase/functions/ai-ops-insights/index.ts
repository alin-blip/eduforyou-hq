import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEAD_STAGES = [
  "🛑 Refuz",
  "👎Prezent Picat",
  "❌ Aplicant Direct",
  "❌ File in Process Picat",
];

type LeadNote = { body?: string; createdAt?: string; userId?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

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

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    // Trag toate leads din dead stages cu notes din ultima lună
    const { data: leads, error: lErr } = await admin
      .from("ghl_leads")
      .select("ghl_opportunity_id, full_name, stage_name, source, notes, last_note_at, assigned_to")
      .in("stage_name", DEAD_STAGES)
      .gte("last_note_at", since)
      .not("notes", "is", null);
    if (lErr) throw lErr;

    const samples: { lead: string; stage: string | null; source: string | null; note: string }[] = [];
    (leads ?? []).forEach((l) => {
      const arr = (l.notes as LeadNote[]) ?? [];
      arr.forEach((n) => {
        if (!n.body) return;
        if (n.createdAt && new Date(n.createdAt) < new Date(since)) return;
        samples.push({
          lead: l.full_name ?? "—",
          stage: l.stage_name,
          source: l.source,
          note: n.body.slice(0, 500),
        });
      });
    });

    if (samples.length === 0) {
      return new Response(JSON.stringify({
        insights: [],
        sampled: 0,
        message: "Nicio notiță în ultima lună pentru leads descalificate. Sincronizează GHL întâi.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Limit context
    const sampleText = samples.slice(0, 200).map((s, i) =>
      `${i + 1}. [${s.stage}] ${s.lead} (sursa: ${s.source ?? "?"}): ${s.note}`,
    ).join("\n");

    const prompt = `Ești analist de date pentru o agenție de educație. Mai jos sunt notițe ale consultanților despre leads care au RENUNȚAT sau au fost respinși în ultima lună. Identifică TOP 5 motive de refuz/renunțare. Pentru fiecare:
- titlu scurt (max 6 cuvinte)
- procent estimativ din total (must sum to ~100)
- 1-2 exemple scurte parafrazate (fără nume reale)
- recomandare concretă pentru echipă (max 1 propoziție)

Notițe (${samples.length} total):
${sampleText}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ești analist concis. Răspunzi DOAR cu apel de funcție." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_top_reasons",
            description: "Top 5 motive de refuz/renunțare",
            parameters: {
              type: "object",
              properties: {
                total_analyzed: { type: "number" },
                reasons: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      percentage: { type: "number" },
                      example: { type: "string" },
                      recommendation: { type: "string" },
                    },
                    required: ["title", "percentage", "example", "recommendation"],
                  },
                },
              },
              required: ["total_analyzed", "reasons"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_top_reasons" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit, încearcă peste un minut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Credit AI epuizat, alimentează la Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway ${aiRes.status}: ${t.slice(0, 200)}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments ?? "{}";
    const parsed = JSON.parse(argsStr);

    return new Response(JSON.stringify({
      insights: parsed.reasons ?? [],
      total_analyzed: parsed.total_analyzed ?? samples.length,
      sampled: samples.length,
      generated_at: new Date().toISOString(),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
