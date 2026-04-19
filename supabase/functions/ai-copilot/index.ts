import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const { messages = [] } = (await req.json()) as { messages: ChatMessage[] };

    // Build company context (RLS scoped to authenticated user)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const [objectives, krs, departments, deals, insights] = await Promise.all([
      admin.from("objectives").select("title,level,status,progress,quarter").limit(50),
      admin.from("key_results").select("title,current_value,target_value,status").limit(50),
      admin.from("departments").select("name,budget_monthly").limit(20),
      admin.from("deals").select("title,value,status,stage_id").limit(50),
      admin.from("ai_insights").select("type,title,content").order("generated_at", { ascending: false }).limit(10),
    ]);

    const context = `
COMPANY: EduForYou (academy + Agent Hub + Partners SAAS)
DEPARTMENTS: ${JSON.stringify(departments.data ?? [])}
OBJECTIVES (${objectives.data?.length ?? 0}): ${JSON.stringify(objectives.data ?? [])}
KEY RESULTS (${krs.data?.length ?? 0}): ${JSON.stringify(krs.data ?? [])}
SALES DEALS (${deals.data?.length ?? 0}): ${JSON.stringify(deals.data ?? [])}
RECENT INSIGHTS: ${JSON.stringify(insights.data ?? [])}
`.trim();

    const systemPrompt = `You are the EduForYou OS Strategic Copilot — an AI advisor for the CEO.
You see the entire company context: OKRs, KRs, departments, deals, finance signals.
Be concise, decisive, and data-driven. Reply in Romanian unless asked otherwise.
When giving recommendations: 1) cite the data point 2) state the action 3) estimate impact.
Use markdown for structure (headings, bullet lists).

CONTEXT:
${context}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Încearcă în câteva secunde." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credit AI epuizat. Adaugă fonduri în Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-copilot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
