import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSlaEvents } from "@/hooks/useSlaEvents";
import { useGhlUsers, displayNameFor } from "@/hooks/useGhlUsers";
import { cn } from "@/lib/utils";

export default function SlaTrackerPage() {
  const { data: events = [], isLoading } = useSlaEvents(1000);
  const { map: usersMap } = useGhlUsers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "respected" | "breached">("all");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return events.filter((e) => {
      if (filter !== "all" && e.status !== filter) return false;
      if (s && !`${e.lead_name ?? ""} ${e.sla_type}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [events, search, filter]);

  const stats = useMemo(() => {
    const total = events.length;
    const respected = events.filter((e) => e.status === "respected").length;
    const breached = events.filter((e) => e.status === "breached").length;
    const avgHours = events.length ? events.reduce((s, e) => s + (e.hours_taken ?? 0), 0) / events.length : 0;
    return { total, respected, breached, pct: total ? Math.round((respected / total) * 100) : 0, avgHours };
  }, [events]);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">SLA Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">Istoric SLA per lead, calculat automat la fiecare schimbare de stage.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total evenimente" value={stats.total} />
        <Stat label="% Respectate" value={`${stats.pct}%`} tone={stats.pct >= 80 ? "ok" : stats.pct >= 60 ? "warn" : "bad"} />
        <Stat label="Breach-uri" value={stats.breached} tone={stats.breached > 0 ? "bad" : "ok"} />
        <Stat label="Medie ore" value={`${stats.avgHours.toFixed(1)}h`} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <Input placeholder="Caută lead sau tip SLA…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">Toate</TabsTrigger>
              <TabsTrigger value="respected">Respectate</TabsTrigger>
              <TabsTrigger value="breached">Breach</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Lead</th>
                  <th className="px-4 py-2">SLA</th>
                  <th className="px-4 py-2">Responsabil</th>
                  <th className="px-4 py-2 text-right">Ore</th>
                  <th className="px-4 py-2 text-right">Deadline</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const breach = e.status === "breached";
                  const u = e.responsible_ghl_user_id ? usersMap.get(e.responsible_ghl_user_id) : undefined;
                  return (
                    <tr key={e.id} className={cn("border-b", breach && "bg-destructive/5")}>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("ro-RO")}</td>
                      <td className="px-4 py-2 font-medium">{e.lead_name ?? "—"}</td>
                      <td className="px-4 py-2 text-xs">{e.sla_type}</td>
                      <td className="px-4 py-2 text-xs">{displayNameFor(u) || e.responsible_ghl_user_id || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{e.hours_taken ?? "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{e.deadline_hours ?? "—"}</td>
                      <td className="px-4 py-2">
                        <Badge variant={breach ? "destructive" : "secondary"}>{e.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Niciun eveniment SLA.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "warn" | "bad" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn(
          "mt-1 font-display text-3xl font-semibold tabular-nums",
          tone === "ok" && "text-success",
          tone === "warn" && "text-warning",
          tone === "bad" && "text-destructive",
        )}>{value}</p>
      </CardContent>
    </Card>
  );
}
