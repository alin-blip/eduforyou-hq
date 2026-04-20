import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, CheckCircle2, AlertTriangle, TrendingUp, Wallet } from "lucide-react";

export type DepartmentPerformance = {
  department_id: string;
  name: string;
  slug: string;
  color: string | null;
  icon: string | null;
  budget_monthly: number;
  headcount: number;
  payroll: number;
  tasks_done: number;
  tasks_created: number;
  tasks_overdue: number;
  tasks_total: number;
  completion_rate: number;
  hours_logged: number;
  spend: number;
  budget_used_pct: number;
  objectives_total: number;
  avg_progress: number;
  on_track: number;
  at_risk: number;
  off_track: number;
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function PerfBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "warning" | "danger" }) {
  const toneClass =
    tone === "danger"
      ? "[&>div]:bg-destructive"
      : tone === "warning"
      ? "[&>div]:bg-amber-500"
      : "[&>div]:bg-primary";
  return <Progress value={Math.min(100, value)} className={`h-1.5 ${toneClass}`} />;
}

export function DepartmentComparison({ departments }: { departments: DepartmentPerformance[] }) {
  if (departments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">Niciun departament configurat încă.</p>
      </Card>
    );
  }

  const maxCompletion = Math.max(...departments.map((d) => d.completion_rate), 1);
  const maxOkr = Math.max(...departments.map((d) => d.avg_progress), 1);

  return (
    <div className="space-y-6">
      {/* Bar chart visual: completion rate */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Completion rate per departament (luna curentă)</h3>
        </div>
        <div className="space-y-3">
          {departments.map((d) => (
            <div key={d.department_id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{d.name}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {d.tasks_done}/{d.tasks_created} · {d.completion_rate}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                  style={{ width: `${(d.completion_rate / Math.max(maxCompletion, 100)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bar chart: OKR progress */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Progres OKR mediu per departament</h3>
        </div>
        <div className="space-y-3">
          {departments.map((d) => (
            <div key={d.department_id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{d.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="h-4 border-emerald-500/40 px-1 text-[9px] text-emerald-500">
                    {d.on_track}
                  </Badge>
                  <Badge variant="outline" className="h-4 border-amber-500/40 px-1 text-[9px] text-amber-500">
                    {d.at_risk}
                  </Badge>
                  <Badge variant="outline" className="h-4 border-destructive/40 px-1 text-[9px] text-destructive">
                    {d.off_track}
                  </Badge>
                  <span className="font-mono tabular-nums text-muted-foreground w-10 text-right">
                    {d.avg_progress}%
                  </span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full bg-gradient-to-r from-accent to-accent/70 transition-all"
                  style={{ width: `${(d.avg_progress / Math.max(maxOkr, 100)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail table */}
      <Card className="overflow-hidden">
        <div className="border-b border-border/50 bg-muted/20 px-4 py-3">
          <h3 className="text-sm font-semibold">Detaliu performanță departamente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/10 text-muted-foreground">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Departament</th>
                <th className="px-3 py-2 font-medium text-right">Headcount</th>
                <th className="px-3 py-2 font-medium text-right">Payroll</th>
                <th className="px-3 py-2 font-medium text-right">Tasks done</th>
                <th className="px-3 py-2 font-medium text-right">Overdue</th>
                <th className="px-3 py-2 font-medium text-right">Ore</th>
                <th className="px-3 py-2 font-medium">Buget folosit</th>
                <th className="px-3 py-2 font-medium text-right">OKR</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.department_id} className="border-b border-border/30 last:border-0 hover:bg-card/40">
                  <td className="px-3 py-2.5 font-medium">{d.name}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{d.headcount}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {fmtEur(d.payroll)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    <span className="text-foreground">{d.tasks_done}</span>
                    <span className="text-muted-foreground">/{d.tasks_created}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {d.tasks_overdue > 0 ? (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {d.tasks_overdue}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {Number(d.hours_logged).toFixed(0)}h
                  </td>
                  <td className="px-3 py-2.5">
                    {d.budget_monthly > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="text-muted-foreground">
                            {fmtEur(d.spend)} / {fmtEur(d.budget_monthly)}
                          </span>
                          <span className="font-mono tabular-nums">{d.budget_used_pct}%</span>
                        </div>
                        <PerfBar
                          value={d.budget_used_pct}
                          tone={d.budget_used_pct > 100 ? "danger" : d.budget_used_pct > 85 ? "warning" : "primary"}
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">— buget nesetat —</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {d.objectives_total > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                        {d.avg_progress}%
                        <span className="text-[10px] text-muted-foreground">({d.objectives_total})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
