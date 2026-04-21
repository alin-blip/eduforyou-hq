import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WeeklyDayKpi = {
  date: string;
  calls_made: number;
  leads_contacted: number;
  leads_qualified: number;
  applications_submitted: number;
  students_enrolled: number;
  leads_new: number;
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function useWeeklyKpis(weekStart: Date) {
  const days: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(isoDay(d));
  }
  const from = days[0];
  const to = days[days.length - 1];

  return useQuery({
    queryKey: ["weekly-kpis", from, to],
    queryFn: async (): Promise<WeeklyDayKpi[]> => {
      const [reportsRes, leadsRes] = await Promise.all([
        supabase
          .from("daily_reports")
          .select("report_date, calls_made, leads_contacted, leads_qualified, applications_submitted, students_enrolled")
          .gte("report_date", from)
          .lte("report_date", to),
        supabase
          .from("ghl_leads")
          .select("ghl_created_at")
          .gte("ghl_created_at", `${from}T00:00:00`)
          .lte("ghl_created_at", `${to}T23:59:59`),
      ]);

      if (reportsRes.error) throw reportsRes.error;
      if (leadsRes.error) throw leadsRes.error;

      const reports = reportsRes.data ?? [];
      const leadsByDay = new Map<string, number>();
      (leadsRes.data ?? []).forEach((l) => {
        const d = (l.ghl_created_at ?? "").slice(0, 10);
        if (d) leadsByDay.set(d, (leadsByDay.get(d) ?? 0) + 1);
      });

      return days.map((d) => {
        const dayReports = reports.filter((r) => r.report_date === d);
        return {
          date: d,
          calls_made: dayReports.reduce((s, r) => s + (r.calls_made ?? 0), 0),
          leads_contacted: dayReports.reduce((s, r) => s + (r.leads_contacted ?? 0), 0),
          leads_qualified: dayReports.reduce((s, r) => s + (r.leads_qualified ?? 0), 0),
          applications_submitted: dayReports.reduce((s, r) => s + (r.applications_submitted ?? 0), 0),
          students_enrolled: dayReports.reduce((s, r) => s + (r.students_enrolled ?? 0), 0),
          leads_new: leadsByDay.get(d) ?? 0,
        };
      });
    },
    staleTime: 60_000,
  });
}
