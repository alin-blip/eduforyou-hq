import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OpsLead = {
  id: string;
  ghl_opportunity_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  stage_name: string | null;
  status: string | null;
  assigned_to: string | null;
  pipeline_name: string | null;
  ghl_updated_at: string | null;
  ghl_created_at: string | null;
  synced_at: string;
};

// SLA per stage (în ore). Dacă timpul de când e în stage > prag => breach.
// Folosim ghl_updated_at ca proxy pt "ultima mișcare în stage".
export const STAGE_SLA_HOURS: Record<string, number> = {
  "😐 Necontactat": 1,
  "❗De Contactat": 4,
  "❌ Nu Raspunde x 1": 24,
  "❌ Nu Raspunde x 2": 48,
  "💬 In Discutii": 72,
  "📨 Consent Form Trimis": 48,
  "✅ Consent Form Semnat": 24,
  "🗓️ Programat la Test": 168, // 7 zile
  "♻️ Reprogramat Absent": 48,
  "❌ Absent Test": 24,
  "❌ Absent x 2": 48,
  "✅ Prezent Trecut (Oferta)": 72,
  "✅ Prezent Trecut (File in Process)": 168,
  "👩🏻 Florentina": 48,
};

// Stage-uri "moarte" — nu intră în queue activ
export const DEAD_STAGES = new Set([
  "🛑 Refuz",
  "👎Prezent Picat",
  "❌ Aplicant Direct",
  "❌ File in Process Picat",
  "🚀 Finantare Aprobata",
]);

export function useOpsLeads() {
  return useQuery({
    queryKey: ["ops-leads"],
    queryFn: async () => {
      // Postgres limit per request = 1000. Paginăm până luăm tot.
      const all: OpsLead[] = [];
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("ghl_leads")
          .select(
            "id, ghl_opportunity_id, full_name, email, phone, stage_name, status, assigned_to, pipeline_name, ghl_updated_at, ghl_created_at, synced_at",
          )
          .order("ghl_updated_at", { ascending: false, nullsFirst: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const batch = (data ?? []) as OpsLead[];
        all.push(...batch);
        if (batch.length < PAGE) break;
        from += PAGE;
        if (from > 25000) break; // safety
      }
      return all;
    },
    staleTime: 60_000,
  });
}

export function hoursSince(iso: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return (Date.now() - t) / 36e5;
}

export function isBreach(stage: string | null, hours: number): boolean {
  if (!stage) return false;
  const sla = STAGE_SLA_HOURS[stage];
  if (!sla) return false;
  return hours > sla;
}
