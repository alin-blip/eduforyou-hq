import { useMemo, useState } from "react";
import { AlertTriangle, Flame, MessageSquare, RefreshCw, Search, Users2 } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useGhlUsers } from "@/hooks/useGhlUsers";
import { LeadDetailDrawer } from "@/components/ops/LeadDetailDrawer";

function fmtAging(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

type LangFilter = "all" | "ro" | "en" | "unassigned";

export default function OpsPage() {
  const { data: leads, isLoading, refetch, isFetching } = useOpsLeads();
  const { map: usersMap, data: ghlUsers } = useGhlUsers();
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState<LangFilter>("all");
  const [assignee, setAssignee] = useState<string>("all");
  const [showOnly, setShowOnly] = useState<"active" | "breach" | "all">("active");
  const [selected, setSelected] = useState<OpsLead | null>(null);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const s = search.trim().toLowerCase();
    return leads.filter((l) => {
      const a = (l.assigned_to ?? "").trim();
      const user = a ? usersMap.get(a) : undefined;

      if (lang === "unassigned" && a) return false;
      if (lang === "ro" && user?.language !== "ro") return false;
      if (lang === "en" && user?.language !== "en") return false;

      if (assignee !== "all") {
        const key = a || "unassigned";
        if (key !== assignee) return false;
      }
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
  }, [leads, usersMap, search, lang, assignee, showOnly]);

  const assigneeOptions = useMemo(() => {
    const seen = new Set<string>();
    (leads ?? []).forEach((l) => {
      const v = (l.assigned_to ?? "").trim();
      seen.add(v ? v : "unassigned");
    });
    // Filter by lang too so dropdown shrinks
    return Array.from(seen)
      .filter((id) => {
        if (id === "unassigned") return lang === "all" || lang === "unassigned";
        const u = usersMap.get(id);
        if (lang === "ro") return u?.language === "ro";
        if (lang === "en") return u?.language === "en";
        if (lang === "unassigned") return false;
        return true;
      })
      .sort((a, b) => {
        const na = usersMap.get(a)?.display_name ?? a;
        const nb = usersMap.get(b)?.display_name ?? b;
        return na.localeCompare(nb);
      });
  }, [leads, usersMap, lang]);

  const byStage = useMemo(() => {
    const map = new Map<string, OpsLead[]>();
    filtered.forEach((l) => {
      const key = l.stage_name ?? "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
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
    let urgent = 0;
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

  // Try to grab GHL location id from any user (set in env at edge fn). For drawer link only.
  const ghlLocationId = (ghlUsers && ghlUsers.length > 0
    ? (import.meta.env.VITE_GHL_LOCATION_ID as string | undefined)
    : undefined) ?? undefined;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Ops Scoreboard — Petea
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Queue per stage din pipeline-ul Master, cu aging și SLA breach. Click pe un lead pentru detalii și notițe.
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

      <Tabs value={lang} onValueChange={(v) => { setLang(v as LangFilter); setAssignee("all"); }}>
        <TabsList>
          <TabsTrigger value="all">Toți</TabsTrigger>
          <TabsTrigger value="ro">🇷🇴 Română</TabsTrigger>
          <TabsTrigger value="en">🇬🇧 Engleză</TabsTrigger>
          <TabsTrigger value="unassigned">Nealocați</TabsTrigger>
        </TabsList>
      </Tabs>

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
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Consultant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți consultanții</SelectItem>
                {assigneeOptions.map((id) => {
                  const u = usersMap.get(id);
                  const name = id === "unassigned" ? "— Nealocat —" : u?.display_name ?? id;
                  return (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  );
                })}
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
            <StageColumn
              key={stage}
              stage={stage}
              items={items}
              usersMap={usersMap}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}

      <LeadDetailDrawer
        lead={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        ghlLocationId={ghlLocationId}
      />
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
              tone === "warning" && "text-warning",
              tone === "danger" && "text-destructive",
            )}
          >
            {value.toLocaleString("ro-RO")}
          </p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-muted",
            tone === "warning" && "bg-warning/10 text-warning",
            tone === "danger" && "bg-destructive/10 text-destructive",
          )}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function StageColumn({
  stage,
  items,
  usersMap,
  onSelect,
}: {
  stage: string;
  items: OpsLead[];
  usersMap: Map<string, { display_name: string }>;
  onSelect: (l: OpsLead) => void;
}) {
  const sla = STAGE_SLA_HOURS[stage];
  const isDead = DEAD_STAGES.has(stage);
  const breachCount = items.filter((l) => {
    const h = hoursSince(l.ghl_updated_at);
    return isBreach(l.stage_name, h);
  }).length;

  const sorted = [...items].sort((a, b) => {
    const ta = a.ghl_updated_at ? new Date(a.ghl_updated_at).getTime() : 0;
    const tb = b.ghl_updated_at ? new Date(b.ghl_updated_at).getTime() : 0;
    return ta - tb;
  });

  return (
    <Card className={cn(isDead && "opacity-70")}>
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
              const assigneeName = l.assigned_to
                ? usersMap.get(l.assigned_to)?.display_name ?? l.assigned_to
                : "Nealocat";
              const hasNotes = (l.notes_count ?? 0) > 0;
              return (
                <button
                  key={l.id}
                  onClick={() => onSelect(l)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/40",
                    breach && "bg-destructive/5",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {l.full_name || l.email || l.phone || "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {assigneeName} · {l.email || l.phone || "no contact"}
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
                    <div className="flex items-center gap-1">
                      {hasNotes && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {l.notes_count}
                        </span>
                      )}
                      {breach && <AlertTriangle className="h-3 w-3 text-destructive" />}
                    </div>
                  </div>
                </button>
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
