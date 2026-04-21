import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudentPipeline, type StudentLead } from "@/hooks/useStudentPipeline";
import { useGhlUsers, displayNameFor } from "@/hooks/useGhlUsers";
import { cn } from "@/lib/utils";

const PIPELINE_STAGES = [
  "😐 Necontactat",
  "❗De Contactat",
  "❌ Nu Raspunde x 1",
  "❌ Nu Raspunde x 2",
  "💬 In Discutii",
  "📨 Consent Form Trimis",
  "✅ Consent Form Semnat",
  "🗓️ Programat la Test",
  "✅ Prezent Trecut (Oferta)",
  "✅ Prezent Trecut (File in Process)",
  "🚀 Finantare Aprobata",
];

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function StudentPipelinePage() {
  const { data: leads = [], isLoading } = useStudentPipeline();
  const { map: usersMap } = useGhlUsers();
  const [search, setSearch] = useState("");
  const [uniFilter, setUniFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (uniFilter !== "all" && (l.university ?? "Necategorizat") !== uniFilter) return false;
      if (s && !`${l.full_name ?? ""} ${l.email ?? ""} ${l.phone ?? ""}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [leads, search, uniFilter]);

  const universities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(l.university ?? "Necategorizat"));
    return Array.from(set);
  }, [leads]);

  const byStage = useMemo(() => {
    const m = new Map<string, StudentLead[]>();
    PIPELINE_STAGES.forEach((s) => m.set(s, []));
    filtered.forEach((l) => {
      if (l.stage_name && PIPELINE_STAGES.includes(l.stage_name)) {
        m.get(l.stage_name)!.push(l);
      }
    });
    return m;
  }, [filtered]);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Student Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kanban Master Pipeline cu fielduri interne (uni, curs, asignare internă).</p>
      </header>

      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4">
          <Input placeholder="Caută…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={uniFilter} onChange={(e) => setUniFilter(e.target.value)}>
            <option value="all">Toate universitățile</option>
            {universities.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const items = byStage.get(stage) ?? [];
            return (
              <Card key={stage} className="min-w-[280px] flex-shrink-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{stage}</CardTitle>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2 p-3">
                      {items.slice(0, 50).map((l) => {
                        const days = daysSince(l.ghl_updated_at);
                        const tone = days >= 5 ? "border-destructive bg-destructive/5" : days >= 2 ? "border-warning bg-warning/5" : "";
                        const u = l.assigned_to ? usersMap.get(l.assigned_to) : undefined;
                        return (
                          <div key={l.id} className={cn("rounded-md border p-2 text-xs", tone)}>
                            <p className="truncate font-medium">{l.full_name ?? "—"}</p>
                            <p className="truncate text-muted-foreground">{l.phone ?? l.email ?? "—"}</p>
                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-muted-foreground">{displayNameFor(u) || "Nealocat"}</span>
                              <span className="tabular-nums text-muted-foreground">{days}d</span>
                            </div>
                          </div>
                        );
                      })}
                      {items.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">—</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
