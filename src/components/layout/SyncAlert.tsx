import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AlertState =
  | { kind: "ok" }
  | { kind: "failed"; at: string; message: string | null }
  | { kind: "stale"; at: string | null };

export function SyncAlert() {
  const [state, setState] = useState<AlertState>({ kind: "ok" });

  const load = async () => {
    const { data } = await supabase
      .from("project_sync_log" as any)
      .select("success, error_message, created_at, source")
      .order("created_at", { ascending: false })
      .limit(1);
    const last = (data as any[] | null)?.[0];
    if (!last) {
      setState({ kind: "stale", at: null });
      return;
    }
    if (!last.success) {
      setState({ kind: "failed", at: last.created_at, message: last.error_message });
      return;
    }
    const ageHours = (Date.now() - new Date(last.created_at).getTime()) / 36e5;
    if (ageHours > 48) {
      setState({ kind: "stale", at: last.created_at });
      return;
    }
    setState({ kind: "ok" });
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);

    // Realtime: refresh immediately when a new sync log row arrives
    const channel = supabase
      .channel("sync-log-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "project_sync_log" },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (state.kind === "ok") return null;

  const isFailed = state.kind === "failed";
  const Icon = isFailed ? AlertTriangle : Clock;
  const colorClasses = isFailed
    ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15"
    : "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/15";

  const tooltipText = isFailed
    ? `Ultima rulare a eșuat ${formatDistanceToNow(new Date(state.at), { addSuffix: true, locale: ro })}${
        state.message ? ` · ${state.message}` : ""
      }`
    : state.at
    ? `Niciun sync de ${formatDistanceToNow(new Date(state.at), { locale: ro })} (>48h)`
    : "Niciun sync înregistrat încă";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/projects"
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors ${colorClasses}`}
          >
            <Icon className="h-3 w-3" />
            {isFailed ? "Sync failed" : "Sync stale"}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
