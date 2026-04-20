import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const callerId = claimsData.claims.sub as string;

    // Only CEO/Executive can re-trigger invites in bulk
    const { data: callerRoles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const allowed = (callerRoles ?? []).some((r) => r.role === "ceo" || r.role === "executive");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden — necesită CEO/Executive" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const emails: string[] = Array.isArray(body?.emails) ? body.emails : [];
    if (emails.length === 0) {
      return new Response(JSON.stringify({ error: "No emails provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://hq.eduforyou.co.uk";
    const redirectTo = `${PUBLIC_SITE_URL.replace(/\/$/, "")}/auth`;

    const results: Array<{ email: string; ok: boolean; error?: string }> = [];

    for (const email of emails) {
      try {
        const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
        if (error) {
          // If already accepted/exists, send a magic link / password recovery instead
          const msg = error.message || "";
          if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered")) {
            const { error: linkErr } = await admin.auth.admin.generateLink({
              type: "magiclink",
              email,
              options: { redirectTo },
            });
            if (linkErr) {
              results.push({ email, ok: false, error: linkErr.message });
            } else {
              results.push({ email, ok: true });
            }
          } else {
            results.push({ email, ok: false, error: msg });
          }
        } else {
          results.push({ email, ok: true });
        }
      } catch (e) {
        results.push({ email, ok: false, error: e instanceof Error ? e.message : "unknown" });
      }
    }

    return new Response(JSON.stringify({ results, redirectTo }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("resend-invites error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
