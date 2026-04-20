import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DepartmentPerformance } from "@/components/reports/DepartmentComparison";
import type { WeeklyReport } from "@/components/reports/WeeklySummary";

const fmtEur = (n: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function exportReportsPdf({
  departments,
  report,
  generatedAt,
}: {
  departments: DepartmentPerformance[];
  report: WeeklyReport | null;
  generatedAt: string | null;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  // ----- Header -----
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("EduForYou — Weekly Executive Report", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Generat: ${new Date(generatedAt ?? new Date().toISOString()).toLocaleString("ro-RO")}`,
    margin,
    18,
  );
  y = 30;

  doc.setTextColor(20, 20, 20);

  // ----- Executive summary -----
  if (report) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Executive Summary", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summary = doc.splitTextToSize(report.executive_summary, pageWidth - margin * 2);
    doc.text(summary, margin, y);
    y += summary.length * 5 + 4;

    // Wins / Concerns side by side
    const colWidth = (pageWidth - margin * 2 - 6) / 2;
    const startY = y;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text("Wins", margin, y);
    doc.setTextColor(239, 68, 68);
    doc.text("Riscuri", margin + colWidth + 6, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);

    const wins = report.wins.map((w, i) => `${i + 1}. ${w}`).join("\n");
    const concerns = report.concerns.map((c, i) => `${i + 1}. ${c}`).join("\n");
    const winsLines = doc.splitTextToSize(wins, colWidth);
    const concernsLines = doc.splitTextToSize(concerns, colWidth);

    doc.text(winsLines, margin, y);
    doc.text(concernsLines, margin + colWidth + 6, y);
    y += Math.max(winsLines.length, concernsLines.length) * 4 + 6;

    // Top performer & underperformer
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(`★ Top: ${report.top_performer.department}`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const topLines = doc.splitTextToSize(report.top_performer.reason, pageWidth - margin * 2);
    doc.text(topLines, margin, y);
    y += topLines.length * 4 + 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(239, 68, 68);
    doc.text(`▼ Necesită atenție: ${report.underperformer.department}`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const downLines = doc.splitTextToSize(
      `${report.underperformer.reason}\nRecomandare: ${report.underperformer.recommendation}`,
      pageWidth - margin * 2,
    );
    doc.text(downLines, margin, y);
    y += downLines.length * 4 + 6;

    // Priorities table
    autoTable(doc, {
      startY: y,
      head: [["#", "Prioritate", "Owner sugerat", "Impact"]],
      body: report.priorities_next_week.map((p, i) => [i + 1, p.title, p.owner_hint, p.impact.toUpperCase()]),
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: margin, right: margin },
      didDrawPage: () => {},
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ----- New page if needed -----
  if (y > 230) {
    doc.addPage();
    y = margin;
  }

  // ----- Department comparison table -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("Comparație performanță departamente", margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Departament",
        "Headcount",
        "Tasks done/created",
        "Overdue",
        "Completion %",
        "OKR avg %",
        "Buget folosit",
      ],
    ],
    body: departments.map((d) => [
      d.name,
      String(d.headcount),
      `${d.tasks_done}/${d.tasks_created}`,
      String(d.tasks_overdue),
      `${d.completion_rate}%`,
      d.objectives_total > 0 ? `${d.avg_progress}%` : "—",
      d.budget_monthly > 0 ? `${fmtEur(d.spend)} / ${fmtEur(d.budget_monthly)} (${d.budget_used_pct}%)` : "—",
    ]),
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { fontStyle: "bold" },
      6: { cellWidth: 50 },
    },
  });

  // ----- Footer on each page -----
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `EduForYou Operating System · pag. ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  const filename = `eduforyou-weekly-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
