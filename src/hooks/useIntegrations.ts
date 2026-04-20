import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type IntegrationKey = "meta_ads" | "ga4" | "ghl";

export type IntegrationStatus = {
  key: IntegrationKey;
  connected: boolean;
  missing_secrets: string[];
};

export function useIntegrationsStatus() {
  return useQuery({
    queryKey: ["integrations-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-integrations-status");
      if (error) throw error;
      return (data?.integrations ?? []) as IntegrationStatus[];
    },
    staleTime: 30_000,
  });
}
