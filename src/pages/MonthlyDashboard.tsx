import { useState } from "react";
import { format, startOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { useMonthlyMetrics } from "@/hooks/useMonthlyMetrics";

const TARGET_ENROLLED = 84;
const REVENUE_PER = 500;

export default function MonthlyDashboardPage() {
  const [month, setMonth] = useState(format(startOfMonth(new Date()), "yyyy-MM"));
  const monthDate = new Date(`${month}-01`);
  const { data, isLoading } = useMonthlyMetrics(monthDate);

  const pct = data ? Math.round((data.enrolled / TARGET_ENROLLED) * 100) : 0;
  const revenue = data ? data.enrolled * REVENUE_PER : 0;

  const uniData = data ? Object.entries(data.byUniversity).map(([name, value]) => ({ name, value })) : [];
  const sourceData = data ? Object.entries(data.bySource).slice(0, 8).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Monthly Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview luna curentă: înrolări, conversion, revenue estimate.</p>
        </div>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-full max-w-xs" />
      </header>

      {isLoading || !data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Big label="Înrolați" value={data.enrolled} />
            <Big label="Target" value={TARGET_ENROLLED} />
            <Big label="% Completare" value={`${pct}%`} />
            <Big label="Revenue est." value={`£${revenue.toLocaleString()}`} />
          </div>

          <Card>
            <CardHeader><CardTitle>Funnel</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-5">
              <Funnel label="Lead-uri" value={data.totalLeads} />
              <Funnel label="Contactate" value={data.contacted} />
              <Funnel label="Calificate" value={data.qualified} />
              <Funnel label="Aplicate" value={data.applied} />
              <Funnel label="Înrolate" value={data.enrolled} />
            </CardContent>
          </Card>

          {data.dailyEnrollment.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Pace zilnic înrolări</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer>
                  <LineChart data={data.dailyEnrollment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Pe universitate</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer>
                  <BarChart data={uniData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Pe sursă (top 8)</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer>
                  <BarChart data={sourceData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--accent))" /></BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Big({ label, value }: { label: string; value: number | string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</p>
    </CardContent></Card>
  );
}

function Funnel({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}
