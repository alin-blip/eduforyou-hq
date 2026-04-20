// Weekly Executive Report — generates AI summary, PDF, uploads to Storage, emails CEO/Executive/Managers.
// Triggered by pg_cron Mondays at 8AM, or on-demand via authenticated invoke.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PERIOD_LABELS: Record<number, string> = {
  1: "ultima lună",
  3: "ultimele 3 luni",
  6: "ultimele 6 luni",
  12: "ultimele 12 luni",
};

interface WeeklyReport {
  executive_summary: string;
  wins: string[];
  concerns: string[];
  top_performer: { department: string; reason: string };
  underperformer: { department: string; reason: string; recommendation: string };
  priorities_next_week: { title: string; owner_hint: string; impact: "low" | "medium" | "high" }[];
}

// ---------- PDF generation ----------
async function generateReportPdf(opts: {
  report: WeeklyReport;
  months: number;
  generatedDate: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const primary = rgb(0.388, 0.4, 0.945); // #6366f1
  const dark = rgb(0.122, 0.161, 0.216); // #1f2937
  const muted = rgb(0.42, 0.45, 0.5);
  const success = rgb(0.063, 0.725, 0.506);
  const danger = rgb(0.937, 0.267, 0.267);

  const drawText = (text: string, opts: { size?: number; bold?: boolean; color?: any; indent?: number } = {}) => {
    const size = opts.size ?? 11;
    const f = opts.bold ? fontBold : font;
    const color = opts.color ?? dark;
    const x = margin + (opts.indent ?? 0);
    const maxWidth = width - margin * 2 - (opts.indent ?? 0);

    // Word-wrap
    const words = text.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxWidth) {
        if (y < margin + size) {
          page = pdf.addPage([595.28, 841.89]);
          y = height - margin;
        }
        page.drawText(line, { x, y, size, font: f, color });
        y -= size * 1.4;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      if (y < margin + size) {
        page = pdf.addPage([595.28, 841.89]);
        y = height - margin;
      }
      page.drawText(line, { x, y, size, font: f, color });
      y -= size * 1.4;
    }
  };

  const skip = (n = 8) => { y -= n; };

  // Header
  page.drawRectangle({
    x: 0, y: height - 80, width, height: 80,
    color: primary,
  });
  page.drawText("EduForYou · Weekly Executive Report", {
    x: margin, y: height - 35, size: 10, font, color: rgb(1, 1, 1),
  });
  page.drawText(`Raport pe ${PERIOD_LABELS[opts.months] ?? `${opts.months} luni`}`, {
    x: margin, y: height - 55, size: 18, font: fontBold, color: rgb(1, 1, 1),
  });
  page.drawText(opts.generatedDate, {
    x: margin, y: height - 72, size: 9, font, color: rgb(1, 1, 1),
  });
  y = height - 110;

  // Executive summary
  drawText("EXECUTIVE SUMMARY", { size: 9, bold: true, color: primary });
  skip(4);
  drawText(opts.report.executive_summary, { size: 11 });
  skip(16);

  // Wins
  drawText("✓ WINS SĂPTĂMÂNA ACEASTA", { size: 10, bold: true, color: success });
  skip(4);
  for (const w of opts.report.wins) {
    drawText(`• ${w}`, { size: 10, indent: 6 });
  }
  skip(12);

  // Concerns
  drawText("⚠ RISCURI & PROBLEME", { size: 10, bold: true, color: danger });
  skip(4);
  for (const c of opts.report.concerns) {
    drawText(`• ${c}`, { size: 10, indent: 6 });
  }
  skip(16);

  // Top performer
  drawText("🏆 TOP PERFORMER", { size: 10, bold: true, color: success });
  skip(2);
  drawText(opts.report.top_performer.department, { size: 13, bold: true });
  drawText(opts.report.top_performer.reason, { size: 10, color: muted });
  skip(12);

  // Underperformer
  drawText("⚠ NECESITĂ ATENȚIE", { size: 10, bold: true, color: danger });
  skip(2);
  drawText(opts.report.underperformer.department, { size: 13, bold: true });
  drawText(opts.report.underperformer.reason, { size: 10, color: muted });
  skip(4);
  drawText(`Recomandare: ${opts.report.underperformer.recommendation}`, { size: 10, bold: true });
  skip(16);

  // Priorities
  drawText("→ PRIORITĂȚI SĂPTĂMÂNA URMĂTOARE", { size: 10, bold: true, color: primary });
  skip(4);
  opts.report.priorities_next_week.forEach((p, i) => {
    drawText(`${i + 1}. ${p.title}`, { size: 11, bold: true });
    drawText(`Owner: ${p.owner_hint} · Impact: ${p.impact.toUpperCase()}`, { size: 9, color: muted, indent: 12 });
    skip(4);
  });

  // Footer
  if (y < margin + 30) {
    page = pdf.addPage([595.28, 841.89]);
    y = height - margin;
  }
  page.drawText("Raport generat automat de EduForYou Unified Hub · AI-powered Chief of Staff", {
    x: margin, y: margin / 2, size: 8, font, color: muted,
  });

  return await pdf.save();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Parse months from body (1, 3, 6, 12) — default 1 for weekly cadence
    let months = 1;
    try {
      const body = await req.json();
      const requested = Number(body?.months);
      if ([1, 3, 6, 12].includes(requested)) months = requested;
    } catch { /* default */ }

    // 1. Fetch data via SECURITY DEFINER RPCs (using service role — bypasses RLS)
    const [{ data: finance }, { data: deptPerf }] = await Promise.all([
      admin.rpc("get_finance_snapshot", { _months: months }),
      admin.rpc("get_department_performance", { _months: months }),
    ]);

    const context = {
      finance: {
        revenue_total: (finance as any)?.revenue_total ?? 0,
        expenses_total: (finance as any)?.expenses_total ?? 0,
        net_profit: (finance as any)?.net_profit ?? 0,
        gross_margin_pct: (finance as any)?.gross_margin_pct ?? 0,
        runway_months: (finance as any)?.runway_months ?? null,
        monthly_burn_recurring: (finance as any)?.monthly_burn_recurring ?? 0,
      },
      departments: ((deptPerf as any)?.departments ?? []).map((d: any) => ({
        name: d.name,
        headcount: d.headcount,
        completion_rate: d.completion_rate,
        tasks_done: d.tasks_done,
        tasks_overdue: d.tasks_overdue,
        avg_okr_progress: d.avg_progress,
        objectives_total: d.objectives_total,
      })),
    };

    // 2. Generate AI report via Lovable AI Gateway
    const tools = [{
      type: "function",
      function: {
        name: "return_weekly_report",
        description: "Return a structured weekly executive report",
        parameters: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            wins: { type: "array", items: { type: "string" } },
            concerns: { type: "array", items: { type: "string" } },
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
            },
          },
          required: ["executive_summary", "wins", "concerns", "top_performer", "underperformer", "priorities_next_week"],
        },
      },
    }];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Ești Chief of Staff pentru EduForYou. Pe baza datelor REALE generezi un Weekly Executive Report în limba română. Folosește exclusiv tool calling. Fii concret, citează cifre, evită generalități.",
          },
          {
            role: "user",
            content: `Generează raport pe ${PERIOD_LABELS[months]} pe baza acestui snapshot real:\n\n${JSON.stringify(context, null, 2)}`,
          },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_weekly_report" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error", aiResp.status, errText);
      return new Response(JSON.stringify({ error: `AI gateway error: ${aiResp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");
    const report = JSON.parse(toolCall.function.arguments) as WeeklyReport;

    // 3. Generate PDF
    const generatedDate = new Date().toLocaleDateString("ro-RO", {
      day: "numeric", month: "long", year: "numeric",
    });
    const pdfBytes = await generateReportPdf({ report, months, generatedDate });

    // 4. Upload to Storage
    const periodSlug = PERIOD_LABELS[months].replace(/\s+/g, "-");
    const dateSlug = new Date().toISOString().slice(0, 10);
    const filePath = `reports/${dateSlug}_weekly-report_${periodSlug}.pdf`;

    const { error: uploadError } = await admin.storage
      .from("weekly-reports")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("PDF upload failed", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 5. Generate signed URL valid 30 days
    const { data: signedUrlData, error: signedError } = await admin.storage
      .from("weekly-reports")
      .createSignedUrl(filePath, 60 * 60 * 24 * 30); // 30 days in seconds

    if (signedError || !signedUrlData) {
      console.error("Signed URL failed", signedError);
      throw new Error("Failed to create signed URL");
    }

    const pdfUrl = signedUrlData.signedUrl;

    // 6. Get all CEO + Executive + Manager emails
    const { data: roleData, error: rolesError } = await admin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["ceo", "executive", "manager"]);

    if (rolesError) throw new Error(`Failed to load recipients: ${rolesError.message}`);

    const userIds = [...new Set((roleData ?? []).map((r) => r.user_id))];
    if (userIds.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No recipients (no CEO/Executive/Manager users)",
        pdfUrl,
        report,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    if (profilesError) throw new Error(`Failed to load profiles: ${profilesError.message}`);

    const recipients = (profiles ?? []).filter((p) => p.email);

    // 7. Send email to each recipient
    const sendResults: Array<{ email: string; ok: boolean; error?: string }> = [];
    for (const r of recipients) {
      try {
        const { data, error } = await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "weekly-report",
            recipientEmail: r.email,
            idempotencyKey: `weekly-report-${dateSlug}-${r.id}`,
            templateData: {
              recipientName: r.full_name?.split(" ")[0] ?? null,
              period: PERIOD_LABELS[months],
              generatedDate,
              executiveSummary: report.executive_summary,
              wins: report.wins,
              concerns: report.concerns,
              topPerformer: report.top_performer,
              underperformer: report.underperformer,
              priorities: report.priorities_next_week,
              pdfUrl,
            },
          },
        });
        if (error) throw error;
        if ((data as any)?.success === false) {
          sendResults.push({ email: r.email!, ok: false, error: (data as any)?.reason ?? "unknown" });
        } else {
          sendResults.push({ email: r.email!, ok: true });
        }
      } catch (e: any) {
        console.error(`Failed to send to ${r.email}:`, e?.message ?? e);
        sendResults.push({ email: r.email!, ok: false, error: String(e?.message ?? e) });
      }
    }

    const sentCount = sendResults.filter((r) => r.ok).length;
    console.log(`Weekly report sent: ${sentCount}/${recipients.length}`, sendResults);

    return new Response(JSON.stringify({
      success: true,
      sent: sentCount,
      total: recipients.length,
      pdfUrl,
      results: sendResults,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("weekly-report-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
