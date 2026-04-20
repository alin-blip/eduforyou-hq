import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export type TaskWithRelations = Task & {
  assignee: { id: string; full_name: string | null; avatar_url: string | null } | null;
  department: { id: string; name: string; color: string | null } | null;
  key_result: { id: string; title: string } | null;
};

export interface TaskFilters {
  departmentId?: string | null;
  assigneeId?: string | null;
  keyResultId?: string | null;
  priority?: TaskPriority | null;
  status?: TaskStatus | null;
  search?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select(
          `*,
          assignee:profiles!tasks_assignee_id_fkey(id,full_name,avatar_url),
          department:departments(id,name,color),
          key_result:key_results(id,title)`
        )
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });

      if (filters.departmentId) q = q.eq("department_id", filters.departmentId);
      if (filters.assigneeId) q = q.eq("assignee_id", filters.assigneeId);
      if (filters.keyResultId) q = q.eq("key_result_id", filters.keyResultId);
      if (filters.priority) q = q.eq("priority", filters.priority);
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.search) q = q.ilike("title", `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as TaskWithRelations[];
    },
  });
}

export function useKeyResultsList() {
  return useQuery({
    queryKey: ["key-results-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("key_results")
        .select("id, title, objective_id")
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TaskInsert) => {
      const { data: userData } = await supabase.auth.getUser();
      const reporter_id = payload.reporter_id ?? userData.user?.id ?? null;
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...payload, reporter_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TaskUpdate }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
