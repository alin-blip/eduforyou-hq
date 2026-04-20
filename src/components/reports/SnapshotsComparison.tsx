import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, TrendingUp, TrendingDown, Minus, History } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export type Snapshot = {
  id: string;
  period: string;
  period_start: string;
  revenue_total: number;
  expenses_total: number;
  net_profit: number;
  gross_margin_pct: number;
  monthly_burn: number;
  runway_months: number | null;
  objectives_total: number;
  objectives_avg_progress: number;
  objectives_on_track: number;
  objectives_at_risk: number;
  tasks_done: number;
  tasks_created: number;
  completion_rate: number;
  pace_score: number;
};

const fmtEur = (n: number) =>
  new Intl.NumberFormat("ro-RO", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function Delta({ current, previous, suffix = "" }: { current: number; previous?: number; suffix?: string }) {
  if (previous === undefined || previous === 0) return <span className="text-muted-foreground">—</span>;
  const delta = current - previous;
  const pct = ((delta / Math.abs(previous)) * 100).toFixed(1);
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const tone = delta > 0 ? "text-emerald-500" : delta < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-mono ${tone}`}>
      <Icon className="h-3 w-3" />
      {delta > 0 ? "+" : ""}{pct}%{suffix}
    </span>
  );
}

export function SnapshotsComparison() {
  const { roles } = useAuth();
  const canBackfill = roles.includes("ceo") || roles.includes("executive");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState({ done: 0, total: 0 });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_snapshots_comparison", { _limit: 12 });
    if (error) toast.error(error.message);
    else if ((data as any)?.error === "forbidden") toast.error("Acces interzis pentru acest raport.");
    else setSnapshots(((data as any)?.snapshots ?? []) as Snapshot[]);
    setLoading(false);
  };

  const captureNow = async () => {
    setCapturing(true);
    const { data, error } = await supabase.rpc("capture_monthly_snapshot", { _target_month: null });
    if (error) toast.error(error.message);
    else {
      toast.success(`Snapshot ${(data as any)?.period} capturat (PACE ${(data as any)?.pace_score})`);
      await load();
    }
    setCapturing(false);
  };

  const backfillHistory = async () => {
    if (!confirm("Generează snapshot-uri pentru ultimele 12 luni? Cele existente vor fi suprascrise cu datele actuale.")) return;
    setBackfilling(true);
    const total = 12;
    setBackfillProgress({ done: 0, total });

    // Generate target months: last 12 full months (excluding current)
    const targets: string[] = [];
    const now = new Date();
    for (let i = 12; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      targets.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    }

    let succeeded = 0;
    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      const { error } = await supabase.rpc("capture_monthly_snapshot", { _target_month: targets[i] });
      if (error) {
        failed++;
        console.error(`Backfill ${targets[i]} failed:`, error.message);
      } else {
        succeeded++;
      }
      setBackfillProgress({ done: i + 1, total });
    }

    setBackfilling(false);
    setBackfillProgress({ done: 0, total: 0 });
    if (failed === 0) {
      toast.success(`Backfill complet: ${succeeded} snapshot-uri generate`);
    } else {
      toast.warning(`Backfill terminat: ${succeeded} reușite, ${failed} eșuate (vezi console)`);
    }
    await load();
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return <Card className="p-12 text-center text-sm text-muted-foreground">Se încarcă snapshot-urile…</Card>;
  }

  if (snapshots.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Camera className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
        <h3 className="font-display text-lg font-semibold mb-2">Niciun snapshot încă</h3>
        <p className="mb-4 text-sm text-muted-foreground max-w-md mx-auto">
          Snapshot-urile lunare se capturează automat pe 1 ale lunii la 02:00 UTC.
          Poți captura unul manual acum sau backfill ultimele 12 luni.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={captureNow} disabled={capturing || backfilling} className="gap-2 bg-gradient-primary">
            <Camera className={`h-4 w-4 ${capturing ? "animate-pulse" : ""}`} />
            {capturing ? "Capturez…" : "Capturează acum"}
          </Button>
          {canBackfill && (
            <Button onClick={backfillHistory} disabled={backfilling || capturing} variant="outline" className="gap-2">
              <History className={`h-4 w-4 ${backfilling ? "animate-pulse" : ""}`} />
              {backfilling ? `Backfill ${backfillProgress.done}/${backfillProgress.total}…` : "Backfill 12 luni"}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const latest = snapshots[snapshots.length - 1];
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : undefined;

  const chartData = snapshots.map((s) => ({
    period: s.period.slice(5), // MM
    PACE: Number(s.pace_score),
    Completion: Number(s.completion_rate),
    OKR: s.objectives_avg_progress,
  }));

  const finChart = snapshots.map((s) => ({
    period: s.period.slice(5),
    Revenue: Number(s.revenue_total),
    Expenses: Number(s.expenses_total),
    Net: Number(s.net_profit),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold">Snapshots lunare ({snapshots.length})</h3>
          <p className="text-xs text-muted-foreground">
            Ultim: {latest.period} · capturate automat pe 1 ale lunii
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2" disabled={backfilling}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          {canBackfill && (
            <Button
              variant="outline"
              size="sm"
              onClick={backfillHistory}
              disabled={backfilling || capturing}
              className="gap-2"
            >
              <History className={`h-3.5 w-3.5 ${backfilling ? "animate-pulse" : ""}`} />
              {backfilling ? `Backfill ${backfillProgress.done}/${backfillProgress.total}` : "Backfill 12 luni"}
            </Button>
          )}
          <Button size="sm" onClick={captureNow} disabled={capturing || backfilling} className="gap-2 bg-gradient-primary">
            <Camera className={`h-3.5 w-3.5 ${capturing ? "animate-pulse" : ""}`} />
            Capture now
          </Button>
        </div>
      </div>

      {/* MoM KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "PACE Score", value: `${latest.pace_score}`, prev: previous?.pace_score, suffix: "" },
          { label: "Revenue", value: fmtEur(latest.revenue_total), prev: previous?.revenue_total, raw: latest.revenue_total },
          { label: "Net Profit", value: fmtEur(latest.net_profit), prev: previous?.net_profit, raw: latest.net_profit },
          { label: "Completion", value: `${latest.completion_rate}%`, prev: previous?.completion_rate, raw: latest.completion_rate },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{kpi.label}</div>
            <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{kpi.value}</div>
            <div className="mt-1">
              <Delta current={kpi.raw ?? Number(kpi.value)} previous={kpi.prev} />
            </div>
          </Card>
        ))}
      </div>

      {/* PACE / OKR / Completion trend */}
      <Card className="p-5">
        <h4 className="mb-3 text-sm font-semibold">Evoluție PACE · OKR · Completion (%)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="PACE" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Completion" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="OKR" stroke="hsl(var(--chart-3, 142 76% 36%))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Finance trend */}
      <Card className="p-5">
        <h4 className="mb-3 text-sm font-semibold">Finanțe lunare (€)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtEur(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="Expenses" stroke="hsl(var(--destructive))" strokeWidth={2} />
              <Line type="monotone" dataKey="Net" stroke="hsl(var(--accent))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* MoM table */}
      <Card className="overflow-hidden">
        <div className="border-b border-border/50 bg-muted/20 px-4 py-3">
          <h4 className="text-sm font-semibold">Comparație lună-pe-lună</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/10 text-muted-foreground">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Perioadă</th>
                <th className="px-3 py-2 font-medium text-right">PACE</th>
                <th className="px-3 py-2 font-medium text-right">Revenue</th>
                <th className="px-3 py-2 font-medium text-right">Expenses</th>
                <th className="px-3 py-2 font-medium text-right">Net</th>
                <th className="px-3 py-2 font-medium text-right">Margin %</th>
                <th className="px-3 py-2 font-medium text-right">OKR avg</th>
                <th className="px-3 py-2 font-medium text-right">Completion</th>
              </tr>
            </thead>
            <tbody>
              {[...snapshots].reverse().map((s) => (
                <tr key={s.id} className="border-b border-border/30 last:border-0 hover:bg-card/40">
                  <td className="px-3 py-2.5 font-medium">{s.period}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{s.pace_score}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmtEur(s.revenue_total)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{fmtEur(s.expenses_total)}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${s.net_profit < 0 ? "text-destructive" : "text-emerald-500"}`}>
                    {fmtEur(s.net_profit)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{s.gross_margin_pct}%</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{s.objectives_avg_progress}%</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{s.completion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
