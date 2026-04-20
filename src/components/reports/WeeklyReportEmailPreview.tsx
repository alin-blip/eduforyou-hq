import type { WeeklyReport } from "./WeeklySummary";

const PERIOD_LABELS: Record<number, string> = {
  1: "ultima lună",
  3: "ultimele 3 luni",
  6: "ultimele 6 luni",
  12: "ultimele 12 luni",
};

interface Props {
  report: WeeklyReport;
  months: number;
  generatedAt?: string | null;
  pdfUrl?: string | null;
}

/**
 * Inline-styled HTML preview of the weekly executive report.
 * Same visual structure as the email template — uses the recipient's
 * email-safe styles so what you see is what gets sent.
 */
export function WeeklyReportEmailPreview({ report, months, generatedAt, pdfUrl }: Props) {
  const period = PERIOD_LABELS[months] ?? `${months} luni`;
  const dateStr = generatedAt
    ? new Date(generatedAt).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div
      style={{
        backgroundColor: "#f4f4f7",
        padding: "24px 12px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            padding: "28px 32px",
            color: "#ffffff",
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.85 }}>
            EduForYou · Weekly Executive Report
          </div>
          <h1 style={{ margin: "8px 0 4px", fontSize: 22, fontWeight: 700 }}>
            Raport pe {period}
          </h1>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{dateStr}</div>
        </div>

        {/* Executive summary */}
        <div style={{ padding: "24px 32px 8px" }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#6366f1", fontWeight: 700, marginBottom: 8 }}>
            Executive summary
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#1f2937" }}>
            {report.executive_summary}
          </p>
        </div>

        {/* PDF download CTA */}
        {pdfUrl && (
          <div style={{ padding: "16px 32px 4px", textAlign: "center" }}>
            <a
              href={pdfUrl}
              style={{
                display: "inline-block",
                backgroundColor: "#6366f1",
                color: "#ffffff",
                padding: "12px 28px",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              📄 Descarcă raport PDF complet
            </a>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
              Link valid 30 de zile
            </div>
          </div>
        )}

        {/* Wins */}
        <div style={{ padding: "20px 32px 8px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginBottom: 10 }}>
            ✓ Wins săptămâna aceasta
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", fontSize: 13, lineHeight: 1.7 }}>
            {report.wins.map((w, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{w}</li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        <div style={{ padding: "16px 32px 8px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 10 }}>
            ⚠ Riscuri & probleme
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", fontSize: 13, lineHeight: 1.7 }}>
            {report.concerns.map((c, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{c}</li>
            ))}
          </ul>
        </div>

        {/* Top performer */}
        <div style={{ padding: "16px 32px 4px" }}>
          <div
            style={{
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#059669", fontWeight: 700 }}>
              🏆 Top performer
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#064e3b", margin: "6px 0 4px" }}>
              {report.top_performer.department}
            </div>
            <div style={{ fontSize: 12, color: "#065f46", lineHeight: 1.5 }}>
              {report.top_performer.reason}
            </div>
          </div>
        </div>

        {/* Underperformer */}
        <div style={{ padding: "12px 32px 8px" }}>
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#dc2626", fontWeight: 700 }}>
              ⚠ Necesită atenție
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#7f1d1d", margin: "6px 0 4px" }}>
              {report.underperformer.department}
            </div>
            <div style={{ fontSize: 12, color: "#991b1b", lineHeight: 1.5, marginBottom: 8 }}>
              {report.underperformer.reason}
            </div>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 12,
                color: "#374151",
              }}
            >
              <strong style={{ color: "#dc2626" }}>Recomandare: </strong>
              {report.underperformer.recommendation}
            </div>
          </div>
        </div>

        {/* Priorities next week */}
        <div style={{ padding: "16px 32px 28px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 12 }}>
            → Priorități săptămâna următoare
          </div>
          {report.priorities_next_week.map((p, i) => {
            const impactColor =
              p.impact === "high" ? "#dc2626" : p.impact === "medium" ? "#6366f1" : "#6b7280";
            const impactBg =
              p.impact === "high" ? "#fef2f2" : p.impact === "medium" ? "#eef2ff" : "#f3f4f6";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "#eef2ff",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    Owner sugerat: {p.owner_hint}
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    padding: "3px 8px",
                    borderRadius: 4,
                    backgroundColor: impactBg,
                    color: impactColor,
                    alignSelf: "flex-start",
                  }}
                >
                  {p.impact}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            padding: "16px 32px",
            backgroundColor: "#fafafa",
            fontSize: 11,
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          Raport generat automat de EduForYou Unified Hub · AI-powered Chief of Staff
        </div>
      </div>
    </div>
  );
}
