import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type StudentLead = {
  id: string;
  ghl_opportunity_id: string;
  ghl_contact_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  stage_name: string | null;
  pipeline_name: string | null;
  source: string | null;
  assigned_to: string | null;
  ghl_updated_at: string | null;
  ghl_created_at: string | null;
  internal_assigned_to: string | null;
  university: string | null;
  course: string | null;
  internal_notes: string | null;
};

export function useStudentPipeline() {
  return useQuery({
    queryKey: ["student-pipeline"],
    queryFn: async (): Promise<StudentLead[]> => {
      const all: StudentLead[] = [];
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("ghl_leads")
          .select(
            "id, ghl_opportunity_id, ghl_contact_id, full_name, email, phone, stage_name, pipeline_name, source, assigned_to, ghl_updated_at, ghl_created_at, internal_assigned_to, university, course, internal_notes",
          )
          .order("ghl_updated_at", { ascending: false, nullsFirst: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const batch = (data ?? []) as unknown as StudentLead[];
        all.push(...batch);
        if (batch.length < PAGE) break;
        from += PAGE;
        if (from > 25000) break;
      }
      return all;
    },
    staleTime: 60_000,
  });
}

export function useUpdateLeadInternal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      internal_assigned_to?: string | null;
      university?: string | null;
      course?: string | null;
      internal_notes?: string | null;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("ghl_leads").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-pipeline"] });
      qc.invalidateQueries({ queryKey: ["ops-leads"] });
      toast.success("Salvat");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
