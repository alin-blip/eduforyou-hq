import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type IntegrationKey = "meta_ads" | "ga4" | "ghl";

type Status = {
  key: IntegrationKey;
  connected: boolean;
  missing_secrets: string[];
};

const REQUIRED: Record<IntegrationKey, string[]> = {
  meta_ads: ["META_APP_ID", "META_APP_SECRET", "META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"],
  ga4: ["GA4_PROPERTY_ID", "GA4_SERVICE_ACCOUNT_JSON"],
  ghl: ["GHL_API_KEY", "GHL_LOCATION_ID"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // AuthZ: only managers/executives/CEO see integration status
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const supa = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: uErr } = await supa.auth.getUser();
    if (uErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hasRole } = await supa.rpc("has_any_role", {
      _user_id: userRes.user.id,
      _roles: ["ceo", "executive", "manager"],
    });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result: Status[] = (Object.keys(REQUIRED) as IntegrationKey[]).map((key) => {
      const required = REQUIRED[key];
      const missing = required.filter((name) => !Deno.env.get(name));
      return {
        key,
        connected: missing.length === 0,
        missing_secrets: missing,
      };
    });

    return new Response(JSON.stringify({ integrations: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
