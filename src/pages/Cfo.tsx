import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, Sparkles, TrendingUp, Loader2, Brain, Plus, Trash2, Pencil, Receipt, Banknote, FileText, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFinance } from "@/hooks/useFinance";
import { FinanceDialog } from "@/components/cfo/FinanceDialog";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

interface Recommendation {
  title: string;
  rationale: string;
  action: string;
  impact_eur_monthly: number;
  severity: "low" | "medium" | "high";
}

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "hsl(var(--secondary))"];

export default function CfoPage() {
  const { revenue, expenses, invoices, debits, snapshot, loading, insert, update, remove } = useFinance();

  const [dialogMode, setDialogMode] = useState<"revenue" | "expense" | "invoice" | "debit" | null>(null);
  const [editing, setEditing] = useState<any>(null);

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const [scenario, setScenario] = useState("Dacă angajez 3 oameni noi (cost 5000€/lună fiecare) și cresc spend Meta cu 30%, care e impactul pe runway?");
  const [scenarioRes, setScenarioRes] = useState<any>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);

  const [ebitda, setEbitda] = useState<any[]>([]);
  const [loadingEbitda, setLoadingEbitda] = useState(false);

  const tableMap = { revenue: "revenue", expense: "expenses", invoice: "invoices", debit: "debits" } as const;

  const openDialog = (mode: typeof dialogMode, row?: any) => {
    setEditing(row ?? null);
    setDialogMode(mode);
  };

  const handleSubmit = async (payload: any) => {
    if (!dialogMode) return;
    const table = tableMap[dialogMode];
    if (editing) await update(table, editing.id, payload);
    else await insert(table, payload);
  };

  const callAI = async (mode: "weekly" | "scenario" | "ebitda", extra?: any) => {
    const { data, error } = await supabase.functions.invoke("ai-cfo-insights", { body: { mode, ...extra } });
    if (error || !data) {
      toast.error(error?.message ?? "Eroare AI CFO");
      return null;
    }
    if (data.error) {
      toast.error(data.error);
      return null;
    }
    return data;
  };

  const generateWeekly = async () => {
    setLoadingRecs(true);
    const data = await callAI("weekly");
    setLoadingRecs(false);
    if (data) setRecs(data.result?.recommendations ?? []);
  };

  const runScenario = async () => {
    if (!scenario.trim()) return;
    setLoadingScenario(true);
    const data = await callAI("scenario", { scenario });
    setLoadingScenario(false);
    if (data) setScenarioRes(data.result?.scenario);
  };

  const computeEbitda = async () => {
    setLoadingEbitda(true);
    const data = await callAI("ebitda");
    setLoadingEbitda(false);
    if (data) setEbitda(data.result?.kpis ?? []);
  };

  const expenseChart = useMemo(() => {
    if (!snapshot?.expense_categories) return [];
    return Object.entries(snapshot.expense_categories).map(([name, value]) => ({ name: name.replace("_", " "), value: Number(value) }));
  }, [snapshot]);

  const revenueChart = useMemo(() => {
    if (!snapshot?.revenue_streams) return [];
    return Object.entries(snapshot.revenue_streams).map(([name, value]) => ({ name, value: Number(value) }));
  }, [snapshot]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs">
            <Wallet className="h-3 w-3 text-accent" />
            <span className="text-muted-foreground">Virtual CFO • Date reale</span>
          </div>
          <h1 className="font-display text-3xl font-semibold">Financiar & AI Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            P&L, cashflow, runway calculate live din DB. AI CFO analizează datele tale reale.
          </p>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="MRR (luna curentă)" value={`€${(snapshot?.revenue_total ?? 0).toLocaleString()}`} accent="primary" />
        <KpiTile label="Burn lunar recurent" value={`€${(snapshot?.monthly_burn_recurring ?? 0).toLocaleString()}`} accent="destructive" />
        <KpiTile label="Profit net" value={`€${(snapshot?.net_profit ?? 0).toLocaleString()}`} accent={snapshot && snapshot.net_profit >= 0 ? "accent" : "destructive"} />
        <KpiTile label="Runway estimat" value={snapshot?.runway_months !== null && snapshot?.runway_months !== undefined ? `${snapshot.runway_months} luni` : "—"} accent="warning" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-card/60 flex-wrap h-auto">
          <TabsTrigger value="overview">P&L Snapshot</TabsTrigger>
          <TabsTrigger value="revenue">Venituri</TabsTrigger>
          <TabsTrigger value="expenses">Cheltuieli</TabsTrigger>
          <TabsTrigger value="invoices">Facturi</TabsTrigger>
          <TabsTrigger value="debits">Datorii</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="scenario">Scenario</TabsTrigger>
          <TabsTrigger value="ebitda">EBITDA</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-card p-5">
              <h3 className="mb-3 font-display text-lg font-semibold">Cheltuieli pe categorie</h3>
              {expenseChart.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Adaugă cheltuieli pentru a vedea distribuția.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={expenseChart} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                      {expenseChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="glass-card p-5">
              <h3 className="mb-3 font-display text-lg font-semibold">Venituri pe linie</h3>
              {revenueChart.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">Adaugă venituri pentru a vedea breakdown-ul.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: 11 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <MiniMetric icon={<Receipt className="h-4 w-4" />} label="De încasat" value={`€${(snapshot?.invoices_outstanding_in ?? 0).toLocaleString()}`} sub={`Cash încasat: €${(snapshot?.cash_collected ?? 0).toLocaleString()}`} />
            <MiniMetric icon={<FileText className="h-4 w-4" />} label="De plătit (facturi)" value={`€${(snapshot?.invoices_outstanding_out ?? 0).toLocaleString()}`} sub="Furnizori" />
            <MiniMetric icon={<Banknote className="h-4 w-4" />} label="Datorii rămase" value={`€${(snapshot?.debt_remaining ?? 0).toLocaleString()}`} sub={`Lunar: €${(snapshot?.debt_monthly_payment ?? 0).toLocaleString()}`} />
          </div>

          <Card className="glass-card p-5">
            <div className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Marjă brută</div>
            <div className="font-display text-3xl font-semibold">{snapshot?.gross_margin_pct ?? 0}%</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Calculat pe ultima lună din venituri confirmate/încasate minus cheltuieli angajate/plătite.
            </p>
          </Card>
        </TabsContent>

        {/* REVENUE */}
        <TabsContent value="revenue" className="mt-6 space-y-3">
          <SectionHeader title="Venituri" onAdd={() => openDialog("revenue")} count={revenue.length} />
          <DataList
            rows={revenue}
            empty="Nu ai înregistrat venituri încă."
            render={(r: any) => (
              <RowCard
                key={r.id}
                primary={r.stream}
                secondary={`${new Date(r.occurred_on).toLocaleDateString("ro-RO")} • ${r.source ?? "—"}`}
                amount={`€${Number(r.amount).toLocaleString()}`}
                badge={r.status}
                badgeTone={r.status === "received" ? "accent" : r.status === "confirmed" ? "primary" : "muted"}
                onEdit={() => openDialog("revenue", r)}
                onDelete={() => remove("revenue", r.id)}
              />
            )}
            loading={loading}
          />
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses" className="mt-6 space-y-3">
          <SectionHeader title="Cheltuieli" onAdd={() => openDialog("expense")} count={expenses.length} />
          <DataList
            rows={expenses}
            empty="Nu ai înregistrat cheltuieli încă."
            render={(r: any) => (
              <RowCard
                key={r.id}
                primary={`${r.category.replace("_", " ")} ${r.is_recurring ? "↻" : ""}`}
                secondary={`${new Date(r.occurred_on).toLocaleDateString("ro-RO")} • ${r.vendor ?? r.description ?? "—"}`}
                amount={`-€${Number(r.amount).toLocaleString()}`}
                amountTone="destructive"
                badge={r.status}
                badgeTone={r.status === "paid" ? "accent" : "muted"}
                onEdit={() => openDialog("expense", r)}
                onDelete={() => remove("expenses", r.id)}
              />
            )}
            loading={loading}
          />
        </TabsContent>

        {/* INVOICES */}
        <TabsContent value="invoices" className="mt-6 space-y-3">
          <SectionHeader title="Facturi" onAdd={() => openDialog("invoice")} count={invoices.length} />
          <DataList
            rows={invoices}
            empty="Nu ai înregistrat facturi încă."
            render={(r: any) => (
              <RowCard
                key={r.id}
                primary={`${r.kind === "outgoing" ? "→" : "←"} ${r.counterparty}${r.number ? ` • #${r.number}` : ""}`}
                secondary={`Emisă ${new Date(r.issued_on).toLocaleDateString("ro-RO")}${r.due_on ? ` • Scadență ${new Date(r.due_on).toLocaleDateString("ro-RO")}` : ""}`}
                amount={`${r.kind === "outgoing" ? "+" : "-"}€${Number(r.amount).toLocaleString()}`}
                amountTone={r.kind === "outgoing" ? "accent" : "destructive"}
                badge={r.status}
                badgeTone={r.status === "paid" ? "accent" : r.status === "overdue" ? "destructive" : "muted"}
                onEdit={() => openDialog("invoice", r)}
                onDelete={() => remove("invoices", r.id)}
              />
            )}
            loading={loading}
          />
        </TabsContent>

        {/* DEBITS */}
        <TabsContent value="debits" className="mt-6 space-y-3">
          <SectionHeader title="Datorii / Credite" onAdd={() => openDialog("debit")} count={debits.length} />
          <DataList
            rows={debits}
            empty="Nu ai datorii înregistrate."
            render={(r: any) => (
              <RowCard
                key={r.id}
                primary={r.creditor}
                secondary={`Sold rămas: €${Number(r.remaining).toLocaleString()} • Lunar: €${Number(r.monthly_payment).toLocaleString()} • ${r.interest_rate ?? 0}% APR`}
                amount={`€${Number(r.principal).toLocaleString()}`}
                badge={r.status}
                badgeTone={r.status === "active" ? "warning" : r.status === "paid_off" ? "accent" : "destructive"}
                onEdit={() => openDialog("debit", r)}
                onDelete={() => remove("debits", r.id)}
              />
            )}
            loading={loading}
          />
        </TabsContent>

        {/* AI INSIGHTS */}
        <TabsContent value="ai" className="mt-6 space-y-4">
          <Card className="glass-card flex items-center justify-between p-5">
            <div>
              <h2 className="font-display text-lg font-semibold">Recomandări săptămânale (date reale)</h2>
              <p className="text-xs text-muted-foreground">AI analizează snapshot-ul tău financiar real și propune 3 acțiuni.</p>
            </div>
            <Button onClick={generateWeekly} disabled={loadingRecs} className="bg-gradient-primary">
              {loadingRecs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generează
            </Button>
          </Card>

          <div className="grid gap-3 md:grid-cols-3">
            {recs.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={cn("glass-card h-full p-5", r.severity === "high" && "border-destructive/40", r.severity === "medium" && "border-warning/40")}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest",
                      r.severity === "high" && "bg-destructive/20 text-destructive",
                      r.severity === "medium" && "bg-warning/20 text-warning",
                      r.severity === "low" && "bg-accent/20 text-accent")}>{r.severity}</span>
                    <span className="text-xs font-semibold text-primary">€{r.impact_eur_monthly.toLocaleString()}/lună</span>
                  </div>
                  <h3 className="mb-2 font-semibold">{r.title}</h3>
                  <p className="mb-3 text-xs text-muted-foreground">{r.rationale}</p>
                  <p className="text-xs"><span className="font-semibold text-foreground">Acțiune:</span> {r.action}</p>
                </Card>
              </motion.div>
            ))}
            {recs.length === 0 && !loadingRecs && (
              <Card className="glass-card col-span-full p-8 text-center text-sm text-muted-foreground">
                Apasă „Generează" pentru recomandări AI bazate pe datele tale financiare reale.
              </Card>
            )}
          </div>
        </TabsContent>

        {/* SCENARIO */}
        <TabsContent value="scenario" className="mt-6 space-y-4">
          <Card className="glass-card p-5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Descrie scenariul în limbaj natural</label>
            <Textarea value={scenario} onChange={(e) => setScenario(e.target.value)} rows={3} className="mt-2" />
            <Button onClick={runScenario} disabled={loadingScenario} className="mt-3 bg-gradient-primary">
              {loadingScenario ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
              Rulează scenariul
            </Button>
          </Card>

          {scenarioRes && (
            <div className="grid gap-3 md:grid-cols-4">
              <KpiTile label="Burn nou" value={`€${Number(scenarioRes.new_burn_eur ?? 0).toLocaleString()}`} accent="destructive" />
              <KpiTile label="Revenue nou" value={`€${Number(scenarioRes.new_revenue_eur ?? 0).toLocaleString()}`} accent="primary" />
              <KpiTile label="Runway nou" value={`${scenarioRes.new_runway_months ?? "—"} luni`} accent="warning" />
              <KpiTile label="Marjă nouă" value={`${scenarioRes.new_margin_pct ?? 0}%`} accent="accent" />
              <Card className="glass-card col-span-full p-5">
                <h3 className="mb-2 font-semibold">Sumar</h3>
                <p className="mb-4 text-sm text-muted-foreground">{scenarioRes.summary}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-destructive">Riscuri</h4>
                    <ul className="space-y-1 text-xs">{scenarioRes.risks?.map((r: string, i: number) => <li key={i}>• {r}</li>)}</ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Oportunități</h4>
                    <ul className="space-y-1 text-xs">{scenarioRes.opportunities?.map((r: string, i: number) => <li key={i}>• {r}</li>)}</ul>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* EBITDA */}
        <TabsContent value="ebitda" className="mt-6 space-y-4">
          <Card className="glass-card flex items-center justify-between p-5">
            <div>
              <h2 className="font-display text-lg font-semibold">Pârghia KPI pe EBITDA</h2>
              <p className="text-xs text-muted-foreground">Pentru fiecare KPI cheie, AI estimează impactul lunar dacă îl îmbunătățești cu 10%.</p>
            </div>
            <Button onClick={computeEbitda} disabled={loadingEbitda} className="bg-gradient-primary">
              {loadingEbitda ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
              Calculează
            </Button>
          </Card>

          <div className="space-y-2">
            {ebitda.map((k, i) => (
              <Card key={i} className="glass-card flex items-center justify-between p-4">
                <div className="flex-1">
                  <p className="font-semibold">{k.kpi}</p>
                  <p className="text-xs text-muted-foreground">{k.current} → {k.improved_10pct} (+10%)</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pârghie</p>
                    <p className="font-semibold text-primary">{k.leverage_score}/10</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Impact EBITDA</p>
                    <p className="font-semibold text-accent">€{Number(k.ebitda_impact_eur_monthly ?? 0).toLocaleString()}/lună</p>
                  </div>
                </div>
              </Card>
            ))}
            {ebitda.length === 0 && !loadingEbitda && (
              <Card className="glass-card p-8 text-center text-sm text-muted-foreground">
                Apasă „Calculează" pentru analiză EBITDA pe baza datelor tale.
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {dialogMode && (
        <FinanceDialog
          open={!!dialogMode}
          onOpenChange={(v) => !v && setDialogMode(null)}
          mode={dialogMode}
          initial={editing}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: string; accent: "primary" | "accent" | "destructive" | "warning" }) {
  const colorMap: Record<string, string> = {
    primary: "text-primary",
    accent: "text-accent",
    destructive: "text-destructive",
    warning: "text-warning",
  };
  return (
    <Card className="glass-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-semibold", colorMap[accent])}>{value}</p>
    </Card>
  );
}

function MiniMetric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="glass-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <p className="font-display text-xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function SectionHeader({ title, onAdd, count }: { title: string; onAdd: () => void; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <Badge variant="outline" className="text-[10px]">{count}</Badge>
      </div>
      <Button onClick={onAdd} size="sm" className="bg-gradient-primary">
        <Plus className="mr-1 h-3 w-3" /> Adaugă
      </Button>
    </div>
  );
}

function DataList({ rows, render, empty, loading }: { rows: any[]; render: (r: any) => React.ReactNode; empty: string; loading: boolean }) {
  if (loading) return <Card className="glass-card p-8 text-center text-sm text-muted-foreground">Se încarcă…</Card>;
  if (rows.length === 0)
    return (
      <Card className="glass-card flex flex-col items-center gap-2 p-8 text-center">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{empty}</p>
      </Card>
    );
  return <div className="space-y-2">{rows.map(render)}</div>;
}

function RowCard({
  primary, secondary, amount, amountTone = "primary", badge, badgeTone = "muted", onEdit, onDelete,
}: {
  primary: string; secondary: string; amount: string;
  amountTone?: "primary" | "accent" | "destructive";
  badge?: string;
  badgeTone?: "primary" | "accent" | "destructive" | "warning" | "muted";
  onEdit: () => void; onDelete: () => void;
}) {
  const amountClass = { primary: "text-primary", accent: "text-accent", destructive: "text-destructive" }[amountTone];
  const badgeClass = {
    primary: "bg-primary/15 text-primary",
    accent: "bg-accent/15 text-accent",
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-warning/15 text-warning",
    muted: "bg-muted text-muted-foreground",
  }[badgeTone];
  return (
    <Card className="glass-card flex items-center justify-between gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold capitalize">{primary}</p>
        <p className="truncate text-xs text-muted-foreground">{secondary}</p>
      </div>
      <div className="flex items-center gap-4">
        {badge && <span className={cn("rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest", badgeClass)}>{badge}</span>}
        <p className={cn("font-display text-base font-semibold", amountClass)}>{amount}</p>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
        </div>
      </div>
    </Card>
  );
}
