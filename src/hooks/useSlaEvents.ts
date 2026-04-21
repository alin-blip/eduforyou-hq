import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SlaEvent = {
  id: string;
  ghl_opportunity_id: string | null;
  lead_name: string | null;
  sla_type: string;
  from_stage: string | null;
  to_stage: string | null;
  responsible_ghl_user_id: string | null;
  responsible_user_id: string | null;
  deadline_hours: number | null;
  hours_taken: number | null;
  deadline_at: string | null;
  actual_completion_at: string | null;
  status: "respected" | "breached" | "pending";
  notes: string | null;
  created_at: string;
};

export function useSlaEvents(limit = 500) {
  return useQuery({
    queryKey: ["sla-events", limit],
    queryFn: async (): Promise<SlaEvent[]> => {
      const { data, error } = await supabase
        .from("sla_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SlaEvent[];
    },
    staleTime: 30_000,
  });
}

export function useSlaEventsForLead(opportunityId: string | null | undefined) {
  return useQuery({
    queryKey: ["sla-events-lead", opportunityId],
    enabled: !!opportunityId,
    queryFn: async (): Promise<SlaEvent[]> => {
      const { data, error } = await supabase
        .from("sla_events")
        .select("*")
        .eq("ghl_opportunity_id", opportunityId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SlaEvent[];
    },
    staleTime: 30_000,
  });
}
