import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mode = (body?.mode ?? "weekly") as "weekly" | "scenario" | "ebitda";
    const scenario = body?.scenario as string | undefined;

    // Mock financial snapshot (will be replaced with real CFO tables in next iteration)
    const financialContext = {
      mrr_eur: 48000,
      monthly_burn_eur: 38000,
      runway_months: 14,
      revenue_streams: { b2c: 22000, agent_hub: 14000, partners_saas: 12000 },
      top_costs: { salaries: 24000, ads_meta: 6500, ads_google: 3500, software: 1800, other: 2200 },
      cac_eur: 95,
      ltv_eur: 720,
      gross_margin_pct: 68,
    };

    let userPrompt = "";
    if (mode === "weekly") {
      userPrompt = `Analizează acest snapshot financiar EduForYou și generează exact 3 recomandări săptămânale prioritare. Pentru fiecare: titlu scurt (≤10 cuvinte), motivare 1 frază pe baza datelor, acțiune concretă, impact estimat în EUR/lună. Răspunde JSON.

DATE: ${JSON.stringify(financialContext)}`;
    } else if (mode === "scenario") {
      userPrompt = `Calculează impactul acestui scenariu pe runway, profit lunar și marjă. Snapshot actual: ${JSON.stringify(financialContext)}.

SCENARIU: "${scenario}"

Returnează JSON cu: assumptions (array string), new_burn_eur, new_revenue_eur, new_runway_months, new_margin_pct, summary (1 paragraf), risks (array string), opportunities (array string).`;
    } else {
      userPrompt = `Pentru fiecare KPI principal (CAC, LTV, conversion rate visitor→lead, retention), estimează impactul EBITDA al unei îmbunătățiri de 10%. Snapshot: ${JSON.stringify(financialContext)}. Returnează JSON cu array kpis: [{kpi, current, improved_10pct, ebitda_impact_eur_monthly, leverage_score (1-10)}].`;
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "return_insights",
          description: "Return structured CFO insights",
          parameters: {
            type: "object",
            properties: {
              mode: { type: "string" },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    rationale: { type: "string" },
                    action: { type: "string" },
                    impact_eur_monthly: { type: "number" },
                    severity: { type: "string", enum: ["low", "medium", "high"] },
                  },
                  required: ["title", "rationale", "action", "impact_eur_monthly", "severity"],
                },
              },
              scenario: {
                type: "object",
                properties: {
                  assumptions: { type: "array", items: { type: "string" } },
                  new_burn_eur: { type: "number" },
                  new_revenue_eur: { type: "number" },
                  new_runway_months: { type: "number" },
                  new_margin_pct: { type: "number" },
                  summary: { type: "string" },
                  risks: { type: "array", items: { type: "string" } },
                  opportunities: { type: "array", items: { type: "string" } },
                },
              },
              kpis: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    kpi: { type: "string" },
                    current: { type: "number" },
                    improved_10pct: { type: "number" },
                    ebitda_impact_eur_monthly: { type: "number" },
                    leverage_score: { type: "number" },
                  },
                  required: ["kpi", "current", "improved_10pct", "ebitda_impact_eur_monthly", "leverage_score"],
                },
              },
            },
          },
        },
      },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Ești AI CFO Strategic. Analizezi date financiare și dai recomandări precise, în RO. Folosește tool calling pentru output structurat." },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_insights" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Credit AI epuizat. Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    return new Response(JSON.stringify({ mode, result, snapshot: financialContext }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-cfo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
