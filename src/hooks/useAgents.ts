import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AgentStatus = "applied" | "approved" | "active" | "inactive";

export type Agent = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  application_date: string | null;
  status: AgentStatus;
  commission_pct: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentReferral = {
  id: string;
  agent_id: string;
  student_name: string;
  ghl_opportunity_id: string | null;
  status: "pending" | "contacted" | "qualified" | "enrolled" | "rejected";
  commission_amount: number | null;
  commission_paid: boolean;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async (): Promise<Agent[]> => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Agent[];
    },
    staleTime: 60_000,
  });
}

export function useAgentReferrals(agentId?: string) {
  return useQuery({
    queryKey: ["agent-referrals", agentId ?? "all"],
    queryFn: async (): Promise<AgentReferral[]> => {
      let q = supabase.from("agent_referrals").select("*").order("created_at", { ascending: false });
      if (agentId) q = q.eq("agent_id", agentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AgentReferral[];
    },
    staleTime: 30_000,
  });
}

export function useUpsertAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Agent> & { name: string }) => {
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("agents").update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agents").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent salvat");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpsertReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<AgentReferral> & { agent_id: string; student_name: string }) => {
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from("agent_referrals").update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agent_referrals").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["agent-referrals"] });
      qc.invalidateQueries({ queryKey: ["agent-referrals", vars.agent_id] });
      toast.success("Referral salvat");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
