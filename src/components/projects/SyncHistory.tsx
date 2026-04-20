import { useEffect, useState } from "react";
import { History, CheckCircle2, XCircle, Cog, User, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SyncLogEntry = {
  id: string;
  source: string;
  triggered_by: string | null;
  metrics_synced: number;
  success: boolean;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
};

export function SyncHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const [entries, setEntries] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("project_sync_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error) setEntries((data as unknown as SyncLogEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Sync history</h3>
          <span className="text-xs text-muted-foreground">· ultimele 10 rulări</span>
        </div>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading} className="h-7 px-2">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 rounded-md bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Nicio rulare încă. Apasă pe „Sync metrici" sau așteaptă cron-ul de la 6 AM.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50">
                <th className="font-medium py-1.5 pr-3">Status</th>
                <th className="font-medium py-1.5 pr-3">Sursă</th>
                <th className="font-medium py-1.5 pr-3">Metrici</th>
                <th className="font-medium py-1.5 pr-3">Durată</th>
                <th className="font-medium py-1.5 pr-3">Când</th>
                <th className="font-medium py-1.5">Detalii</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-border/30 last:border-0">
                  <td className="py-2 pr-3">
                    {e.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge
                      variant="outline"
                      className={`gap-1 h-5 px-1.5 text-[10px] ${
                        e.source === "cron" ? "border-primary/40 text-primary" : ""
                      }`}
                    >
                      {e.source === "cron" ? <Cog className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                      {e.source}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3 font-mono tabular-nums">{e.metrics_synced}</td>
                  <td className="py-2 pr-3 font-mono tabular-nums text-muted-foreground">
                    {e.duration_ms !== null ? `${e.duration_ms}ms` : "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ro })}
                  </td>
                  <td className="py-2 text-muted-foreground truncate max-w-[200px]">
                    {e.error_message ? (
                      <span className="text-destructive" title={e.error_message}>
                        {e.error_message}
                      </span>
                    ) : (
                      <span className="text-emerald-600/80">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
