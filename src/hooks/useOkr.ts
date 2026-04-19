import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Objective = Database["public"]["Tables"]["objectives"]["Row"] & {
  department: { id: string; name: string } | null;
  owner: { id: string; full_name: string | null; avatar_url: string | null } | null;
  key_results: Database["public"]["Tables"]["key_results"]["Row"][];
};

export type ObjectiveInsert = Database["public"]["Tables"]["objectives"]["Insert"];
export type ObjectiveUpdate = Database["public"]["Tables"]["objectives"]["Update"];
export type KeyResult = Database["public"]["Tables"]["key_results"]["Row"];
export type KeyResultInsert = Database["public"]["Tables"]["key_results"]["Insert"];
export type KeyResultUpdate = Database["public"]["Tables"]["key_results"]["Update"];

export function currentQuarter(d = new Date()): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
}

export function useObjectives(quarter?: string) {
  return useQuery({
    queryKey: ["objectives", quarter ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("objectives")
        .select(
          `*,
          department:departments(id,name),
          owner:profiles!objectives_owner_id_fkey(id,full_name,avatar_url),
          key_results(*)`,
        )
        .order("created_at", { ascending: false });

      if (quarter) query = query.eq("quarter", quarter);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Objective[];
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, department_id")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ObjectiveInsert) => {
      const { data, error } = await supabase
        .from("objectives")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["objectives"] }),
  });
}

export function useUpdateObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ObjectiveUpdate }) => {
      const { data, error } = await supabase
        .from("objectives")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["objectives"] }),
  });
}

export function useDeleteObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("objectives").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["objectives"] }),
  });
}

export function useCreateKeyResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: KeyResultInsert) => {
      const { data, error } = await supabase
        .from("key_results")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["objectives"] }),
  });
}

export function useUpdateKeyResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: KeyResultUpdate }) => {
      const { data, error } = await supabase
        .from("key_results")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["objectives"] }),
  });
}

export function useDeleteKeyResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("key_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["objectives"] }),
  });
}
