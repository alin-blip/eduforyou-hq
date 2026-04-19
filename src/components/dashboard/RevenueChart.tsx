import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { month: "Ian", revenue: 42, costs: 30 },
  { month: "Feb", revenue: 48, costs: 32 },
  { month: "Mar", revenue: 55, costs: 34 },
  { month: "Apr", revenue: 61, costs: 36 },
  { month: "Mai", revenue: 58, costs: 38 },
  { month: "Iun", revenue: 72, costs: 41 },
  { month: "Iul", revenue: 80, costs: 44 },
  { month: "Aug", revenue: 88, costs: 47 },
  { month: "Sep", revenue: 95, costs: 50 },
];

export function RevenueChart() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold">Revenue vs Costuri</h3>
          <p className="text-xs text-muted-foreground">Ultimele 9 luni · k EUR</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Revenue</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Costuri</span>
          </span>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revGrad)"
            />
            <Area
              type="monotone"
              dataKey="costs"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              fill="url(#costGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
