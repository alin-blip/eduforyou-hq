import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plug,
  Facebook,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useIntegrationsStatus, type IntegrationKey } from "@/hooks/useIntegrations";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

type IntegrationDef = {
  key: IntegrationKey;
  name: string;
  description: string;
  icon: typeof Plug;
  color: string;
  features: string[];
  docs: string;
  setupHint: string;
};

const INTEGRATIONS: IntegrationDef[] = [
  {
    key: "meta_ads",
    name: "Meta Ads",
    description: "Facebook & Instagram — campanii, spend, ROAS, CPL",
    icon: Facebook,
    color: "from-blue-500 to-blue-700",
    features: ["Spend zilnic", "ROAS pe campanie", "CPL & CPM", "Audiences"],
    docs: "https://developers.facebook.com/docs/marketing-apis/",
    setupHint: "Necesită App ID, App Secret, Access Token (long-lived) și Ad Account ID din Meta Business.",
  },
  {
    key: "ga4",
    name: "Google Analytics 4",
    description: "Sesiuni, conversii, surse de trafic, funnel",
    icon: BarChart3,
    color: "from-orange-500 to-amber-600",
    features: ["Sesiuni & users", "Conversion rate", "Top pages", "Acquisition channels"],
    docs: "https://developers.google.com/analytics/devguides/reporting/data/v1",
    setupHint: "Necesită Service Account JSON (cu rol Viewer pe property) și GA4 Property ID.",
  },
  {
    key: "ghl",
    name: "GoHighLevel",
    description: "Leads, pipeline, contacte, conversii CRM",
    icon: Users,
    color: "from-emerald-500 to-teal-600",
    features: ["Leads sync", "Pipeline stages", "Contact tags", "Conversii"],
    docs: "https://highlevel.stoplight.io/docs/integrations/",
    setupHint: "Necesită API Key (Settings → API Keys) și Location ID.",
  },
];

export default function IntegrationsPage() {
  const { isAdmin, hasRole } = useAuth();
  const isManager = isAdmin || hasRole("ceo") || hasRole("executive") || hasRole("manager");
  const { data: statuses, isLoading, refetch, isFetching } = useIntegrationsStatus();

  const statusMap = useMemo(() => {
    const m = new Map<IntegrationKey, { connected: boolean; missing: string[] }>();
    (statuses ?? []).forEach((s) =>
      m.set(s.key, { connected: s.connected, missing: s.missing_secrets })
    );
    return m;
  }, [statuses]);

  const connectedCount = (statuses ?? []).filter((s) => s.connected).length;
  const totalCount = INTEGRATIONS.length;

  const handleConnect = (def: IntegrationDef) => {
    const status = statusMap.get(def.key);
    const missing = status?.missing ?? [];
    if (missing.length === 0) {
      toast.info(`${def.name} este deja conectat.`);
      return;
    }
    toast.message(`Pentru ${def.name}, am nevoie de aceste secrete:`, {
      description: missing.join(", ") + " — spune-mi în chat „adaugă secretele pentru " + def.name + "” și te ghidez.",
      duration: 8000,
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Plug className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Integrări Marketing & Data
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Surse de date conectate
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aici se conectează platformele de unde HQ-ul preia metrici reale.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {connectedCount}/{totalCount} conectate
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {!isManager && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Doar managerii și executivii pot configura integrările.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((def, idx) => {
          const status = statusMap.get(def.key);
          const connected = status?.connected ?? false;
          const Icon = def.icon;

          return (
            <motion.div
              key={def.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="relative overflow-hidden h-full flex flex-col">
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${def.color}`}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${def.color} shadow-elegant`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {isLoading ? (
                      <Skeleton className="h-6 w-24" />
                    ) : connected ? (
                      <Badge className="gap-1 bg-success/15 text-success border-success/30 hover:bg-success/20">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <AlertCircle className="h-3 w-3" /> Disconnected
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg pt-2">{def.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{def.description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <ul className="space-y-1.5">
                    {def.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-foreground/80">
                        <span className="h-1 w-1 rounded-full bg-gradient-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {!connected && status && status.missing.length > 0 && (
                    <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 text-xs">
                      <p className="font-medium text-foreground/90 mb-1">Secrete lipsă:</p>
                      <code className="text-[10px] text-muted-foreground break-all">
                        {status.missing.join(", ")}
                      </code>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground italic">{def.setupHint}</p>

                  <div className="flex gap-2 mt-auto pt-2">
                    {connected ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled
                        title="Sync va veni în următoarea iterație"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-2" /> Sync (în curând)
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!isManager}
                        onClick={() => handleConnect(def)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-2" /> Conectează
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                      <a href={def.docs} target="_blank" rel="noopener noreferrer" title="Documentație">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="bg-muted/20 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Plug className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Cum funcționează</p>
              <p className="text-muted-foreground">
                Statusul „Connected” apare automat când toate secretele necesare sunt configurate
                în backend. Apasă „Conectează” și îți spun exact ce secrete trebuie adăugate — le
                cer printr-un dialog securizat (nu apar niciodată în cod).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
