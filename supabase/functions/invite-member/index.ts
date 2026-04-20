import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AppRole = "ceo" | "executive" | "manager" | "member";

interface InvitePayload {
  email: string;
  full_name: string;
  role: AppRole;
  department_id?: string | null;
  job_title?: string | null;
}

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
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify caller is CEO/executive/manager
    const { data: callerRoles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const allowedRoles = new Set(["ceo", "executive", "manager"]);
    const isAuthorized = (callerRoles ?? []).some((r) => allowedRoles.has(r.role));
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Forbidden — necesită rol manager+" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as InvitePayload;
    if (!payload.email || !payload.full_name || !payload.role) {
      return new Response(JSON.stringify({ error: "Missing email, full_name or role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only CEO can grant CEO/executive
    if ((payload.role === "ceo" || payload.role === "executive")) {
      const isCeo = (callerRoles ?? []).some((r) => r.role === "ceo");
      if (!isCeo) {
        return new Response(JSON.stringify({ error: "Doar CEO poate invita CEO/Executive" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Send Supabase invite (triggers handle_new_user → creates profile + default member role)
    // Prefer explicit PUBLIC_SITE_URL, fallback to request origin
    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL");
    const origin = req.headers.get("origin") ?? "";
    // Avoid using preview/sandbox URLs for invite links
    const isPreviewOrigin = /lovable\.app|lovableproject\.com|localhost/i.test(origin);
    const baseUrl = publicSiteUrl || (isPreviewOrigin ? "https://hq.eduforyou.co.uk" : origin);
    const redirectTo = `${baseUrl.replace(/\/$/, "")}/auth`;

    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(payload.email, {
      data: { full_name: payload.full_name },
      redirectTo,
    });

    if (inviteErr) {
      // If user already exists, try to fetch and continue
      const msg = inviteErr.message || "";
      if (!msg.toLowerCase().includes("already")) {
        return new Response(JSON.stringify({ error: msg }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let userId = inviteData?.user?.id;
    if (!userId) {
      // Lookup existing user by email
      const { data: list } = await admin.auth.admin.listUsers();
      userId = list?.users.find((u) => u.email === payload.email)?.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Could not resolve user id" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile with extra info (trigger created the row already)
    await admin
      .from("profiles")
      .update({
        full_name: payload.full_name,
        job_title: payload.job_title ?? null,
        department_id: payload.department_id ?? null,
      })
      .eq("id", userId);

    // Set role: replace default with requested role
    if (payload.role !== "member") {
      await admin.from("user_roles").delete().eq("user_id", userId);
      await admin.from("user_roles").insert({ user_id: userId, role: payload.role });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("invite-member error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
