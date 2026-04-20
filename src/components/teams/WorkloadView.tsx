import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDepartmentsList, type ProfileWithRoles } from "@/hooks/useTeams";

type WorkloadRow = {
  member: ProfileWithRoles;
  activeTasks: number;
  totalEstimated: number;
  capacity: number;
  utilization: number;
  overdue: number;
};

export function WorkloadView({ members }: { members: ProfileWithRoles[] }) {
  const { data: departments = [] } = useDepartmentsList();
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const { data: tasks = [] } = useQuery({
    queryKey: ["workload-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, assignee_id, estimated_hours, status, due_date")
        .in("status", ["todo", "in_progress", "blocked"]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo<WorkloadRow[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return members
      .filter((m) => deptFilter === "all" || m.department_id === deptFilter)
      .map((m) => {
        const mine = tasks.filter((t) => t.assignee_id === m.id);
        const totalEstimated = mine.reduce((s, t) => s + (Number(t.estimated_hours) || 0), 0);
        const capacity = m.weekly_capacity_hours ?? 40;
        const utilization = capacity > 0 ? Math.round((totalEstimated / capacity) * 100) : 0;
        const overdue = mine.filter((t) => t.due_date && t.due_date < today).length;
        return { member: m, activeTasks: mine.length, totalEstimated, capacity, utilization, overdue };
      })
      .sort((a, b) => b.utilization - a.utilization);
  }, [members, tasks, deptFilter]);

  const overloaded = rows.filter((r) => r.utilization > 80).length;
  const underutilized = rows.filter((r) => r.utilization < 30).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> {overloaded} suprasolicitați
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> {underutilized} sub 30%
          </Badge>
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Toate departamentele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate departamentele</SelectItem>
            {departments.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Capacitate vs alocare săptămânală
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Niciun membru găsit pentru filtrele curente.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const status =
                  r.utilization > 80 ? "destructive" : r.utilization < 30 ? "secondary" : "default";
                const initials = (r.member.full_name || r.member.email || "?")
                  .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
                return (
                  <div key={r.member.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8">
                          {r.member.avatar_url && <AvatarImage src={r.member.avatar_url} />}
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.member.full_name ?? r.member.email}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.member.department?.name ?? "Fără departament"} · {r.activeTasks} task-uri active
                            {r.overdue > 0 && <span className="text-destructive"> · {r.overdue} întârziate</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {r.totalEstimated.toFixed(1)}h / {r.capacity}h
                        </span>
                        <Badge variant={status as any} className="tabular-nums min-w-[3.5rem] justify-center">
                          {r.utilization}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={Math.min(r.utilization, 100)} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
