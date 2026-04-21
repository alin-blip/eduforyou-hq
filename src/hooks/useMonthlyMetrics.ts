import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MonthlyMetrics = {
  totalLeads: number;
  contacted: number;
  qualified: number;
  applied: number;
  enrolled: number;
  byUniversity: Record<string, number>;
  bySource: Record<string, number>;
  dailyEnrollment: { date: string; count: number; cumulative: number }[];
};

const ENROLLED_STAGES = new Set(["🚀 Finantare Aprobata", "✅ Inscris", "✅ Înscris"]);
const APPLIED_STAGES = new Set([
  "🎓 Aplicație Trimisă",
  "✅ Prezent Trecut (File in Process)",
  "👩🏻 Florentina",
]);
const QUALIFIED_STAGES = new Set([
  "💬 In Discutii",
  "📨 Consent Form Trimis",
  "✅ Consent Form Semnat",
  "🗓️ Programat la Test",
]);
const CONTACTED_NEG = new Set(["😐 Necontactat", "❗De Contactat"]);

export function useMonthlyMetrics(month: Date) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  return useQuery({
    queryKey: ["monthly-metrics", startISO, endISO],
    queryFn: async (): Promise<MonthlyMetrics> => {
      const all: { stage_name: string | null; source: string | null; university: string | null; ghl_created_at: string | null; ghl_updated_at: string | null }[] = [];
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("ghl_leads")
          .select("stage_name, source, university, ghl_created_at, ghl_updated_at")
          .gte("ghl_created_at", startISO)
          .lte("ghl_created_at", endISO)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        all.push(...(data ?? []));
        if ((data ?? []).length < PAGE) break;
        from += PAGE;
        if (from > 25000) break;
      }

      let contacted = 0,
        qualified = 0,
        applied = 0,
        enrolled = 0;
      const byUniversity: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      const dayMap = new Map<string, number>();

      all.forEach((l) => {
        const s = l.stage_name ?? "";
        if (!CONTACTED_NEG.has(s)) contacted++;
        if (QUALIFIED_STAGES.has(s)) qualified++;
        if (APPLIED_STAGES.has(s)) applied++;
        if (ENROLLED_STAGES.has(s)) {
          enrolled++;
          const day = (l.ghl_updated_at ?? l.ghl_created_at ?? "").slice(0, 10);
          if (day) dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
        }
        const uni = (l.university ?? "Necategorizat").trim() || "Necategorizat";
        byUniversity[uni] = (byUniversity[uni] ?? 0) + 1;
        const src = (l.source ?? "Other").trim() || "Other";
        bySource[src] = (bySource[src] ?? 0) + 1;
      });

      const days = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      let cum = 0;
      const dailyEnrollment = days.map(([date, count]) => {
        cum += count;
        return { date, count, cumulative: cum };
      });

      return {
        totalLeads: all.length,
        contacted,
        qualified,
        applied,
        enrolled,
        byUniversity,
        bySource,
        dailyEnrollment,
      };
    },
    staleTime: 60_000,
  });
}
