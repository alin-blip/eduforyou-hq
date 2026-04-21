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
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const sinceLabel = new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString("ro-RO");

    // Lead-uri noi în 24h
    const { data: newLeads } = await admin
      .from("ghl_leads")
      .select("full_name, source, stage_name, assigned_to, ghl_created_at")
      .gte("ghl_created_at", since);

    // Lead-uri descalificate cu notes în 24h
    const { data: deadLeads } = await admin
      .from("ghl_leads")
      .select("full_name, stage_name, source, notes, last_note_body, last_note_at, assigned_to")
      .in("stage_name", DEAD_STAGES)
      .gte("last_note_at", since);

    // SLA breaches în 24h
    const { data: slaBreaches } = await admin
      .from("sla_events")
      .select("lead_name, sla_type, hours_taken, deadline_hours, responsible_ghl_user_id")
      .eq("status", "breached")
      .gte("created_at", since);

    // Map nume consultanți
    const { data: ghlUsers } = await admin.from("ghl_users").select("ghl_user_id, display_name");
    const userMap = new Map((ghlUsers ?? []).map((u) => [u.ghl_user_id, u.display_name]));
    const nameOf = (id: string | null) => (id ? userMap.get(id) ?? id : "Nealocat");

    const totalNew = newLeads?.length ?? 0;
    const totalDead = deadLeads?.length ?? 0;
    const totalBreaches = slaBreaches?.length ?? 0;

    // Per consultant new leads
    const perConsultant = new Map<string, number>();
    (newLeads ?? []).forEach((l) => {
      const k = nameOf(l.assigned_to);
      perConsultant.set(k, (perConsultant.get(k) ?? 0) + 1);
    });

    // Build HTML
    const deadRows = (deadLeads ?? []).slice(0, 30).map((l) => {
      const arr = (l.notes as LeadNote[]) ?? [];
      const recent = arr
        .filter((n) => n.createdAt && new Date(n.createdAt).getTime() >= Date.now() - 24 * 3600 * 1000)
        .map((n) => n.body)
        .filter(Boolean)
        .join(" • ");
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${l.full_name ?? "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${l.stage_name ?? "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${nameOf(l.assigned_to)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#444;">${recent || l.last_note_body || "—"}</td>
      </tr>`;
    }).join("");

    const consultantList = Array.from(perConsultant.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `<li><b>${name}</b>: ${count}</li>`)
      .join("");

    const breachRows = (slaBreaches ?? []).slice(0, 20).map((s) => `
      <tr>
        <td style="padding:6px;border-bottom:1px solid #eee;">${s.lead_name ?? "—"}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;font-size:12px;">${s.sla_type}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;color:#c00;">${s.hours_taken}h / ${s.deadline_hours}h</td>
        <td style="padding:6px;border-bottom:1px solid #eee;">${nameOf(s.responsible_ghl_user_id)}</td>
      </tr>`).join("");

    const html = `<div style="font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:20px;color:#111;">
      <h1 style="margin:0 0 8px;">📊 Daily Ops Report — ${sinceLabel}</h1>
      <p style="color:#666;">Sumar leads, descalificări și SLA în ultimele 24h.</p>

      <div style="display:flex;gap:12px;margin:16px 0;">
        <div style="flex:1;background:#f4f4f5;padding:14px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:700;">${totalNew}</div>
          <div style="font-size:11px;color:#666;text-transform:uppercase;">Lead-uri noi</div>
        </div>
        <div style="flex:1;background:#fff4f4;padding:14px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#c00;">${totalDead}</div>
          <div style="font-size:11px;color:#666;text-transform:uppercase;">Descalificate</div>
        </div>
        <div style="flex:1;background:#fff8e1;padding:14px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#b25c00;">${totalBreaches}</div>
          <div style="font-size:11px;color:#666;text-transform:uppercase;">SLA breach</div>
        </div>
      </div>

      <h3>Lead-uri noi per consultant</h3>
      <ul>${consultantList || "<li>Niciun lead nou</li>"}</ul>

      <h3>Motive renunțare (notițe consultanți)</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#fafafa;text-align:left;">
          <th style="padding:8px;">Lead</th><th style="padding:8px;">Stage</th>
          <th style="padding:8px;">Consultant</th><th style="padding:8px;">Notă</th>
        </tr></thead>
        <tbody>${deadRows || `<tr><td colspan="4" style="padding:16px;text-align:center;color:#666;">Niciuna în ultimele 24h</td></tr>`}</tbody>
      </table>

      ${totalBreaches > 0 ? `
      <h3>SLA breach</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#fafafa;text-align:left;">
          <th style="padding:6px;">Lead</th><th style="padding:6px;">Tip</th>
          <th style="padding:6px;">Ore</th><th style="padding:6px;">Responsabil</th>
        </tr></thead>
        <tbody>${breachRows}</tbody>
      </table>` : ""}

      <p style="margin-top:24px;font-size:12px;color:#888;">Generat automat de eduforyou-hq · <a href="https://hq.eduforyou.co.uk/ops">Vezi în Ops</a></p>
    </div>`;

    // Recipients: managerii și CEO din profiles
    const { data: recipients } = await admin
      .from("user_roles")
      .select("user_id")
      .in("role", ["ceo", "executive", "manager"]);
    const userIds = Array.from(new Set((recipients ?? []).map((r) => r.user_id)));
    const { data: profiles } = await admin
      .from("profiles")
      .select("email, full_name")
      .in("id", userIds);
    const emails = (profiles ?? []).map((p) => p.email).filter((e): e is string => !!e);

    if (emails.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no recipients" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      // Fallback: enqueue în queue-ul existent de email
      await admin.rpc("enqueue_email", {
        queue_name: "transactional_email_queue",
        payload: {
          template: "ops-daily-report",
          to: emails,
          subject: `📊 Daily Ops Report — ${sinceLabel}`,
          html,
        },
      });
      return new Response(JSON.stringify({ ok: true, queued: emails.length }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "EduForYou HQ <reports@hq.eduforyou.co.uk>",
        to: emails,
        subject: `📊 Daily Ops Report — ${sinceLabel}`,
        html,
      }),
    });
    const sendOk = sent.ok;

    return new Response(JSON.stringify({
      ok: sendOk,
      sent: sendOk ? emails.length : 0,
      stats: { totalNew, totalDead, totalBreaches },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
