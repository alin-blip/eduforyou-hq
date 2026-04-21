import { useState } from "react";
import { startOfWeek, format, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklyKpis } from "@/hooks/useWeeklyKpis";
import { cn } from "@/lib/utils";

const TARGETS = {
  calls_made: 300,
  leads_contacted: 150,
  leads_qualified: 50,
  applications_submitted: 30,
  students_enrolled: 21,
};

const ROWS: { key: keyof typeof TARGETS | "leads_new"; label: string }[] = [
  { key: "leads_new", label: "Lead-uri noi (GHL)" },
  { key: "leads_contacted", label: "Lead-uri contactate" },
  { key: "calls_made", label: "Apeluri totale" },
  { key: "leads_qualified", label: "Lead-uri calificate" },
  { key: "applications_submitted", label: "Aplicații trimise" },
  { key: "students_enrolled", label: "Studenți înrolați" },
];

function tone(value: number, target: number | undefined): string {
  if (!target) return "";
  if (value >= target) return "text-success font-semibold";
  if (value >= target * 0.8) return "text-warning font-semibold";
  return "text-destructive font-semibold";
}

export default function WeeklyKpisPage() {
  const [weekRef, setWeekRef] = useState(format(new Date(), "yyyy-MM-dd"));
  const weekStart = startOfWeek(new Date(weekRef), { weekStartsOn: 1 });
  const { data: days, isLoading } = useWeeklyKpis(weekStart);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Weekly KPIs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Săptămâna {format(weekStart, "dd MMM")} – {format(addDays(weekStart, 4), "dd MMM yyyy")}
          </p>
        </div>
        <Input type="date" value={weekRef} onChange={(e) => setWeekRef(e.target.value)} className="w-full max-w-xs" />
      </header>

      {isLoading || !days ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <Card>
          <CardHeader><CardTitle>Metrice × zi</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-2">Metric</th>
                  {days.map((d) => (
                    <th key={d.date} className="px-3 py-2 text-right">{format(new Date(d.date), "EEE dd")}</th>
                  ))}
                  <th className="px-4 py-2 text-right">Total</th>
                  <th className="px-4 py-2 text-right">Target</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const values = days.map((d) => d[row.key] as number);
                  const total = values.reduce((a, b) => a + b, 0);
                  const target = (TARGETS as Record<string, number>)[row.key];
                  return (
                    <tr key={row.key} className="border-b">
                      <td className="px-4 py-2 font-medium">{row.label}</td>
                      {values.map((v, i) => (
                        <td key={i} className="px-3 py-2 text-right tabular-nums">{v}</td>
                      ))}
                      <td className={cn("px-4 py-2 text-right tabular-nums", tone(total, target))}>{total}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{target ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
