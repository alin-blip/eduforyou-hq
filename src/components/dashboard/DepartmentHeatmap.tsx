import { cn } from "@/lib/utils";

interface DepartmentRow {
  name: string;
  okr: number;
  kpi: number;
  workload: number;
  morale: number;
}

const departments: DepartmentRow[] = [
  { name: "Marketing", okr: 78, kpi: 84, workload: 92, morale: 70 },
  { name: "Sales", okr: 65, kpi: 72, workload: 85, morale: 80 },
  { name: "Operations", okr: 88, kpi: 90, workload: 60, morale: 85 },
  { name: "Product", okr: 72, kpi: 68, workload: 75, morale: 78 },
  { name: "Agent Hub", okr: 55, kpi: 62, workload: 88, morale: 65 },
  { name: "Partners SAAS", okr: 48, kpi: 55, workload: 70, morale: 72 },
];

const metrics = ["okr", "kpi", "workload", "morale"] as const;
const metricLabels: Record<(typeof metrics)[number], string> = {
  okr: "OKR",
  kpi: "KPI",
  workload: "Load",
  morale: "Morale",
};

function cellColor(value: number) {
  if (value >= 80) return "bg-accent/80 text-accent-foreground";
  if (value >= 65) return "bg-primary/70 text-primary-foreground";
  if (value >= 50) return "bg-warning/70 text-warning-foreground";
  return "bg-destructive/70 text-destructive-foreground";
}

export function DepartmentHeatmap() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold">Performanță departamente</h3>
          <p className="text-xs text-muted-foreground">
            Heatmap pe 4 dimensiuni cheie · luna curentă
          </p>
        </div>
        <div className="hidden items-center gap-3 text-[10px] text-muted-foreground md:flex">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-accent" /> &gt;80
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-primary" /> 65-79
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-warning" /> 50-64
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-destructive" /> &lt;50
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-1">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium">Departament</th>
              {metrics.map((m) => (
                <th key={m} className="px-2 text-center font-medium">
                  {metricLabels[m]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.name}>
                <td className="py-1 pr-3 text-sm font-medium text-foreground">{d.name}</td>
                {metrics.map((m) => (
                  <td key={m} className="px-1">
                    <div
                      className={cn(
                        "mx-auto flex h-9 w-full items-center justify-center rounded-md font-mono text-xs font-semibold transition-transform hover:scale-105",
                        cellColor(d[m]),
                      )}
                    >
                      {d[m]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
