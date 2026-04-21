import { useMemo, useState } from "react";
import { AlertTriangle, Flame, RefreshCw, Search, Users2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DEAD_STAGES,
  STAGE_SLA_HOURS,
  hoursSince,
  isBreach,
  useOpsLeads,
  type OpsLead,
} from "@/hooks/useOpsLeads";

function fmtAging(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function OpsPage() {
  const { data: leads, isLoading, refetch, isFetching } = useOpsLeads();
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState<string>("all");
  const [showOnly, setShowOnly] = useState<"active" | "breach" | "all">("active");

  const filtered = useMemo(() => {
    if (!leads) return [];
    const s = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (assignee !== "all" && (l.assigned_to ?? "unassigned") !== assignee) return false;
      if (showOnly === "active" && l.stage_name && DEAD_STAGES.has(l.stage_name)) return false;
      if (showOnly === "breach") {
        const h = hoursSince(l.ghl_updated_at);
        if (!isBreach(l.stage_name, h)) return false;
      }
      if (s) {
        const hay = [l.full_name, l.email, l.phone].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [leads, search, assignee, showOnly]);

  const assigneeOptions = useMemo(() => {
    const set = new Set<string>();
    (leads ?? []).forEach((l) => set.add(l.assigned_to ?? "unassigned"));
    return Array.from(set).sort();
  }, [leads]);

  const byStage = useMemo(() => {
    const map = new Map<string, OpsLead[]>();
    filtered.forEach((l) => {
      const key = l.stage_name ?? "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
    // Sort stages: active SLA-tracked first (by SLA asc), then others, dead last
    return Array.from(map.entries()).sort((a, b) => {
      const aDead = DEAD_STAGES.has(a[0]) ? 1 : 0;
      const bDead = DEAD_STAGES.has(b[0]) ? 1 : 0;
      if (aDead !== bDead) return aDead - bDead;
      const aSla = STAGE_SLA_HOURS[a[0]] ?? 9999;
      const bSla = STAGE_SLA_HOURS[b[0]] ?? 9999;
      return aSla - bSla;
    });
  }, [filtered]);

  const totals = useMemo(() => {
    let active = 0;
    let breach = 0;
    let urgent = 0; // breach pe stage cu SLA <= 4h
    filtered.forEach((l) => {
      if (l.stage_name && DEAD_STAGES.has(l.stage_name)) return;
      active += 1;
      const h = hoursSince(l.ghl_updated_at);
      if (isBreach(l.stage_name, h)) {
        breach += 1;
        const sla = STAGE_SLA_HOURS[l.stage_name ?? ""] ?? 9999;
        if (sla <= 4) urgent += 1;
      }
    });
    return { active, breach, urgent };
  }, [filtered]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Ops Scoreboard — Petea
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Queue per stage din pipeline-ul Master, cu aging și SLA breach. Click pe un stage ca să vezi leads-urile.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiTile label="Active leads" value={totals.active} icon={<Users2 className="h-4 w-4" />} />
        <KpiTile
          label="SLA breach"
          value={totals.breach}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={totals.breach > 0 ? "warning" : "default"}
        />
        <KpiTile
          label="Urgent (≤4h SLA)"
          value={totals.urgent}
          icon={<Flame className="h-4 w-4" />}
          tone={totals.urgent > 0 ? "danger" : "default"}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută după nume, email sau telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți assignees</SelectItem>
                {assigneeOptions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a === "unassigned" ? "— Nealocat —" : a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={showOnly} onValueChange={(v) => setShowOnly(v as typeof showOnly)}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="breach">Breach</TabsTrigger>
                <TabsTrigger value="all">Toate</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {byStage.map(([stage, items]) => (
            <StageColumn key={stage} stage={stage} items={items} />
          ))}
        </div>
      )}
    </div>
  );
}

function KpiTile({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 font-display text-3xl font-semibold tabular-nums",
              tone === "warning" && "text-amber-500",
              tone === "danger" && "text-destructive",
            )}
          >
            {value.toLocaleString("ro-RO")}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-muted",
            tone === "warning" && "bg-amber-500/10 text-amber-500",
            tone === "danger" && "bg-destructive/10 text-destructive",
          )}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function StageColumn({ stage, items }: { stage: string; items: OpsLead[] }) {
  const sla = STAGE_SLA_HOURS[stage];
  const isDead = DEAD_STAGES.has(stage);
  const breachCount = items.filter((l) => {
    const h = hoursSince(l.ghl_updated_at);
    return isBreach(l.stage_name, h);
  }).length;

  // Sort by oldest first (most stuck) within SLA-tracked stages
  const sorted = [...items].sort((a, b) => {
    const ta = a.ghl_updated_at ? new Date(a.ghl_updated_at).getTime() : 0;
    const tb = b.ghl_updated_at ? new Date(b.ghl_updated_at).getTime() : 0;
    return ta - tb;
  });

  return (
    <Card className={cn(isDead && "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-sm font-semibold">{stage}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {sla ? `SLA: ${sla}h` : isDead ? "Stage final" : "Fără SLA"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="tabular-nums">
              {items.length}
            </Badge>
            {breachCount > 0 && (
              <Badge variant="destructive" className="tabular-nums text-[10px]">
                {breachCount} breach
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-72">
          <div className="divide-y divide-border">
            {sorted.slice(0, 50).map((l) => {
              const h = hoursSince(l.ghl_updated_at);
              const breach = isBreach(l.stage_name, h);
              return (
                <div
                  key={l.id}
                  className={cn(
                    "flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-muted/40",
                    breach && "bg-destructive/5",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {l.full_name || l.email || l.phone || "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.assigned_to ?? "Nealocat"} · {l.email || l.phone || "no contact"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums",
                        breach ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {fmtAging(h)}
                    </span>
                    {breach && <AlertTriangle className="h-3 w-3 text-destructive" />}
                  </div>
                </div>
              );
            })}
            {sorted.length > 50 && (
              <div className="px-4 py-2 text-center text-xs text-muted-foreground">
                +{sorted.length - 50} more
              </div>
            )}
            {sorted.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Niciun lead
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
