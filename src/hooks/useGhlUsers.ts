import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type GhlUser = {
  ghl_user_id: string;
  display_name: string;
  language: "ro" | "en" | "other";
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function useGhlUsers() {
  const q = useQuery({
    queryKey: ["ghl-users"],
    queryFn: async (): Promise<GhlUser[]> => {
      const { data, error } = await supabase
        .from("ghl_users")
        .select("*")
        .order("display_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GhlUser[];
    },
    staleTime: 60_000,
  });

  const map = new Map<string, GhlUser>();
  (q.data ?? []).forEach((u) => map.set(u.ghl_user_id, u));

  return { ...q, map };
}

export function useUpdateGhlUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      ghl_user_id: string;
      display_name?: string;
      language?: "ro" | "en" | "other";
      is_active?: boolean;
      notes?: string | null;
    }) => {
      const { ghl_user_id, ...patch } = input;
      const { error } = await supabase
        .from("ghl_users")
        .update(patch)
        .eq("ghl_user_id", ghl_user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ghl-users"] });
      toast.success("User actualizat");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function languageLabel(lang: GhlUser["language"]): string {
  if (lang === "ro") return "🇷🇴 Română";
  if (lang === "en") return "🇬🇧 Engleză";
  return "❓ Altul";
}
