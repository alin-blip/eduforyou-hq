import { useEffect, useMemo, useState } from "react";
import { History, CheckCircle2, XCircle, Cog, User, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const PAGE_SIZE = 10;

export function SyncHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const [entries, setEntries] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("project_sync_log" as any)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
    if (statusFilter !== "all") query = query.eq("success", statusFilter === "success");

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (!error) {
      setEntries((data as unknown as SyncLogEntry[]) ?? []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, sourceFilter, statusFilter, page]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [sourceFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const showingFrom = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Sync history</h3>
          <span className="text-xs text-muted-foreground">· {totalCount} rulări total</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder="Sursă" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate sursele</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="cron">Cron</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              <SelectItem value="success">Succes</SelectItem>
              <SelectItem value="error">Eroare</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={load} disabled={loading} className="h-7 px-2">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 rounded-md bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          {totalCount === 0
            ? 'Nicio rulare încă. Apasă pe „Sync metrici" sau așteaptă cron-ul de la 6 AM.'
            : "Nicio rulare nu se potrivește cu filtrele selectate."}
        </p>
      ) : (
        <>
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
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
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
                        <span className="text-accent">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/30">
            <span className="text-[11px] text-muted-foreground">
              Afișez {showingFrom}-{showingTo} din {totalCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="h-7 px-2"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-[11px] text-muted-foreground tabular-nums px-2">
                {page + 1} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="h-7 px-2"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
