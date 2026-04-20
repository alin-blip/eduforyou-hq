import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type DepartmentInsert = Database["public"]["Tables"]["departments"]["Insert"];
export type DepartmentUpdate = Database["public"]["Tables"]["departments"]["Update"];

export type ProfileWithRoles = Profile & {
  roles: AppRole[];
  department: Pick<Department, "id" | "name" | "color"> | null;
};

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      // Try full SELECT (works for admins/managers). Fallback to safe directory RPC for members.
      const { data: fullProfiles, error: pErr } = await supabase
        .from("profiles")
        .select("*, department:departments(id,name,color)")
        .order("full_name");

      let profiles: any[] = [];
      if (!pErr && fullProfiles) {
        profiles = fullProfiles;
      } else {
        // Members: use security-definer directory (no email/phone/cost)
        const { data: dir, error: dErr } = await supabase.rpc("get_team_directory");
        if (dErr) throw dErr;
        profiles = (dir ?? []).map((p: any) => ({ ...p, department: null }));
      }

      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const rolesByUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        rolesByUser.set(r.user_id, arr);
      });

      return profiles.map((p) => ({
        ...p,
        roles: rolesByUser.get(p.id) ?? [],
      })) as ProfileWithRoles[];
    },
  });
}

export function useDepartmentsList() {
  return useQuery({
    queryKey: ["departments-list"],
    queryFn: async () => {
      // Managers+: full select with manager join. Members: safe directory.
      const { data, error } = await supabase
        .from("departments")
        .select("*, manager:profiles!departments_manager_id_fkey(id,full_name,avatar_url)")
        .order("name");
      if (!error && data) return data;

      const { data: dir, error: dErr } = await supabase.rpc("get_departments_directory");
      if (dErr) throw dErr;
      return (dir ?? []).map((d: any) => ({ ...d, manager: null, budget_monthly: null })) as any;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProfileUpdate }) => {
      const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}

export function useSetUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: AppRole[] }) => {
      // Replace strategy: delete then insert
      const { error: dErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (dErr) throw dErr;
      if (roles.length > 0) {
        const { error: iErr } = await supabase
          .from("user_roles")
          .insert(roles.map((role) => ({ user_id: userId, role })));
        if (iErr) throw iErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-members"] }),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DepartmentInsert) => {
      const { data, error } = await supabase.from("departments").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments-list"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: DepartmentUpdate }) => {
      const { data, error } = await supabase.from("departments").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments-list"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments-list"] });
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      full_name: string;
      role: AppRole;
      department_id?: string | null;
      job_title?: string | null;
    }) => {
      const { data, error } = await supabase.functions.invoke("invite-member", { body: payload });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team-members"] }),
  });
}
