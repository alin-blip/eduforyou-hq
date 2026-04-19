import { useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEntity } from "@/hooks/useEntity";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Row {
  kr_id: string;
  title: string;
  objective: string;
  owner_name: string | null;
  status: string;
  progress: number;
}

export default function AccountabilityPage() {
  const { current } = useEntity();
  const [rows, setRows] = useState<Row[]>([]);
  const [unassigned, setUnassigned] = useState(0);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const { data: krs } = await supabase
        .from("key_results")
        .select("id, title, status, current_value, target_value, owner_id, objective_id");
      const { data: objs } = await supabase.from("objectives").select("id, title");
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email");

      if (!krs) return;
      const objMap = new Map(objs?.map((o) => [o.id, o.title]) ?? []);
      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name ?? p.email ?? "—"]) ?? []);

      const mapped: Row[] = krs.map((k: any) => {
        const target = Number(k.target_value) || 1;
        const current = Number(k.current_value) || 0;
        const progress = Math.max(0, Math.min(100, Math.round((current / target) * 100)));
        return {
          kr_id: k.id,
          title: k.title,
          objective: objMap.get(k.objective_id) ?? "—",
          owner_name: k.owner_id ? profileMap.get(k.owner_id) ?? null : null,
          status: k.status,
          progress,
        };
      });
      setRows(mapped);
      setUnassigned(mapped.filter((r) => !r.owner_name).length);
    })();
  }, [current]);

  // Group by owner
  const byOwner = rows.reduce<Record<string, Row[]>>((acc, r) => {
    const key = r.owner_name ?? "Fără owner";
    (acc[key] = acc[key] ?? []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs">
          <ShieldCheck className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Accountability Matrix</span>
        </div>
        <h1 className="font-display text-3xl font-semibold">Cine răspunde de ce KPI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fiecare Key Result trebuie să aibă un owner. Fără owner → fără accountability.
        </p>
      </header>

      {unassigned > 0 && (
        <Card className="border-warning/40 bg-warning/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-semibold text-warning">{unassigned} Key Results fără owner</p>
              <p className="text-xs text-muted-foreground">
                Asignează un owner fiecărui KR pentru a păstra accountability.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(byOwner).map(([owner, list]) => {
          const avgProgress = Math.round(list.reduce((s, r) => s + r.progress, 0) / list.length);
          const isUnassigned = owner === "Fără owner";
          return (
            <Card key={owner} className={cn("glass-card p-5", isUnassigned && "border-warning/40")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
                      isUnassigned ? "bg-warning/20 text-warning" : "bg-gradient-primary text-primary-foreground",
                    )}
                  >
                    {isUnassigned ? <AlertTriangle className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-semibold">{owner}</p>
                    <p className="text-xs text-muted-foreground">{list.length} KR · avg {avgProgress}%</p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    avgProgress >= 70 ? "bg-accent/20 text-accent" : avgProgress >= 40 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive",
                  )}
                >
                  {avgProgress >= 70 ? "On track" : avgProgress >= 40 ? "At risk" : "Off track"}
                </Badge>
              </div>
              <div className="space-y-2">
                {list.map((r) => (
                  <div key={r.kr_id} className="rounded-lg border border-border/40 bg-card/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium">{r.title}</p>
                      <span className="shrink-0 text-xs font-semibold text-primary">{r.progress}%</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.objective}
                    </p>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/40">
                      <div className="h-full bg-gradient-primary" style={{ width: `${r.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        {rows.length === 0 && (
          <Card className="glass-card col-span-full p-8 text-center text-sm text-muted-foreground">
            Niciun Key Result încă. Creează obiective și KR în pagina /okr.
          </Card>
        )}
      </div>
    </div>
  );
}
