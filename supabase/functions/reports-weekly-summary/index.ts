import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    // Parse months from body (1, 3, 6, 12)
    let months = 1;
    try {
      const body = await req.json();
      const requested = Number(body?.months);
      if ([1, 3, 6, 12].includes(requested)) months = requested;
    } catch { /* default */ }

    // Pull real data via existing SECURITY DEFINER functions
    const [{ data: finance }, { data: deptPerf }] = await Promise.all([
      userClient.rpc("get_finance_snapshot", { _months: months }),
      userClient.rpc("get_department_performance", { _months: months }),
    ]);

    if (finance?.error === "forbidden" || deptPerf?.error === "forbidden") {
      return new Response(JSON.stringify({ error: "Doar managerii și executivii pot rula raportul." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = {
      finance: {
        revenue_total: finance?.revenue_total ?? 0,
        expenses_total: finance?.expenses_total ?? 0,
        net_profit: finance?.net_profit ?? 0,
        gross_margin_pct: finance?.gross_margin_pct ?? 0,
        runway_months: finance?.runway_months ?? null,
        monthly_burn_recurring: finance?.monthly_burn_recurring ?? 0,
        revenue_streams: finance?.revenue_streams ?? {},
      },
      departments: (deptPerf?.departments ?? []).map((d: any) => ({
        name: d.name,
        headcount: d.headcount,
        completion_rate: d.completion_rate,
        tasks_done: d.tasks_done,
        tasks_overdue: d.tasks_overdue,
        budget_used_pct: d.budget_used_pct,
        avg_okr_progress: d.avg_progress,
        objectives_total: d.objectives_total,
      })),
    };

    const tools = [
      {
        type: "function",
        function: {
          name: "return_weekly_report",
          description: "Return a structured weekly executive report",
          parameters: {
            type: "object",
            properties: {
              executive_summary: {
                type: "string",
                description: "2-3 sentence headline of the week (in Romanian).",
              },
              wins: {
                type: "array",
                items: { type: "string" },
                description: "3-5 concrete wins from the data (Romanian).",
              },
              concerns: {
                type: "array",
                items: { type: "string" },
                description: "3-5 concrete risks or red flags (Romanian).",
              },
              top_performer: {
                type: "object",
                properties: {
                  department: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["department", "reason"],
              },
              underperformer: {
                type: "object",
                properties: {
                  department: { type: "string" },
                  reason: { type: "string" },
                  recommendation: { type: "string" },
                },
                required: ["department", "reason", "recommendation"],
              },
              priorities_next_week: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    owner_hint: { type: "string" },
                    impact: { type: "string", enum: ["low", "medium", "high"] },
                  },
                  required: ["title", "owner_hint", "impact"],
                },
                description: "3-5 prioritized actions for next week (Romanian).",
              },
            },
            required: [
              "executive_summary",
              "wins",
              "concerns",
              "top_performer",
              "underperformer",
              "priorities_next_week",
            ],
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
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Ești Chief of Staff pentru EduForYou. Pe baza datelor REALE de financiar și performanță departamente, generezi un Weekly Executive Report în limba română. Folosește exclusiv tool calling pentru output structurat. Fii concret, citează cifre din date, evită generalități.",
          },
          {
            role: "user",
            content: `Generează raport pe ultimele ${months} ${months === 1 ? "lună" : "luni"} pe baza acestui snapshot real:\n\n${JSON.stringify(context, null, 2)}`,
          },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_weekly_report" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Încearcă peste un minut." }), {
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
    const report = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    return new Response(
      JSON.stringify({ report, snapshot: context, months, generated_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("reports-weekly-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
