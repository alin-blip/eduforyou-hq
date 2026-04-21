import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DailyReport = {
  id: string;
  user_id: string;
  report_date: string;
  calls_made: number;
  leads_contacted: number;
  leads_qualified: number;
  documents_collected: number;
  applications_submitted: number;
  students_enrolled: number;
  blockers: string | null;
  notes: string | null;
  submitted_at: string | null;
  locked: boolean;
  created_at: string;
  updated_at: string;
};

export function useDailyReports(date: string) {
  return useQuery({
    queryKey: ["daily-reports", date],
    queryFn: async (): Promise<DailyReport[]> => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("report_date", date);
      if (error) throw error;
      return (data ?? []) as DailyReport[];
    },
    staleTime: 30_000,
  });
}

export function useDailyReportsRange(from: string, to: string) {
  return useQuery({
    queryKey: ["daily-reports-range", from, to],
    queryFn: async (): Promise<DailyReport[]> => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .gte("report_date", from)
        .lte("report_date", to);
      if (error) throw error;
      return (data ?? []) as DailyReport[];
    },
    staleTime: 30_000,
  });
}

export function useUpsertDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<DailyReport> & { user_id: string; report_date: string }) => {
      const { data, error } = await supabase
        .from("daily_reports")
        .upsert(input, { onConflict: "user_id,report_date" })
        .select()
        .single();
      if (error) throw error;
      return data as DailyReport;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["daily-reports", vars.report_date] });
      qc.invalidateQueries({ queryKey: ["daily-reports-range"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSubmitDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("daily_reports")
        .update({ submitted_at: new Date().toISOString(), locked: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-reports"] });
      qc.invalidateQueries({ queryKey: ["daily-reports-range"] });
      toast.success("Raport blocat");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
