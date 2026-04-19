import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Sparkles, TrendingUp, Loader2, Brain } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Recommendation {
  title: string;
  rationale: string;
  action: string;
  impact_eur_monthly: number;
  severity: "low" | "medium" | "high";
}

interface Snapshot {
  mrr_eur: number;
  monthly_burn_eur: number;
  runway_months: number;
  revenue_streams: Record<string, number>;
  cac_eur: number;
  ltv_eur: number;
  gross_margin_pct: number;
}

export default function CfoPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const [scenario, setScenario] = useState("Dacă angajez 3 oameni noi (cost 5000€/lună fiecare) și cresc spend Meta cu 30%, care e impactul pe runway?");
  const [scenarioRes, setScenarioRes] = useState<any>(null);
  const [loadingScenario, setLoadingScenario] = useState(false);

  const [ebitda, setEbitda] = useState<any[]>([]);
  const [loadingEbitda, setLoadingEbitda] = useState(false);

  const generateWeekly = async () => {
    setLoadingRecs(true);
    const { data, error } = await supabase.functions.invoke("ai-cfo-insights", { body: { mode: "weekly" } });
    setLoadingRecs(false);
    if (error || !data) return toast.error("Eroare AI CFO");
    setRecs(data.result?.recommendations ?? []);
    setSnapshot(data.snapshot);
  };

  const runScenario = async () => {
    if (!scenario.trim()) return;
    setLoadingScenario(true);
    const { data, error } = await supabase.functions.invoke("ai-cfo-insights", { body: { mode: "scenario", scenario } });
    setLoadingScenario(false);
    if (error || !data) return toast.error("Eroare AI CFO");
    setScenarioRes(data.result?.scenario);
    setSnapshot(data.snapshot);
  };

  const computeEbitda = async () => {
    setLoadingEbitda(true);
    const { data, error } = await supabase.functions.invoke("ai-cfo-insights", { body: { mode: "ebitda" } });
    setLoadingEbitda(false);
    if (error || !data) return toast.error("Eroare AI CFO");
    setEbitda(data.result?.kpis ?? []);
    setSnapshot(data.snapshot);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs">
            <Wallet className="h-3 w-3 text-accent" />
            <span className="text-muted-foreground">Virtual CFO</span>
          </div>
          <h1 className="font-display text-3xl font-semibold">Financiar & AI Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            P&L, runway, recomandări AI și scenario engine pentru decizii rapide.
          </p>
        </div>
      </header>

      <Tabs defaultValue="ai">
        <TabsList className="bg-card/60">
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="scenario">Scenario Engine</TabsTrigger>
          <TabsTrigger value="ebitda">EBITDA Leverage</TabsTrigger>
          <TabsTrigger value="overview">Snapshot</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-6 space-y-4">
          <Card className="glass-card flex items-center justify-between p-5">
            <div>
              <h2 className="font-display text-lg font-semibold">Recomandări săptămânale</h2>
              <p className="text-xs text-muted-foreground">AI analizează MRR, burn, ROAS și sugerează 3 acțiuni cu impact maxim.</p>
            </div>
            <Button onClick={generateWeekly} disabled={loadingRecs} className="bg-gradient-primary">
              {loadingRecs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generează
            </Button>
          </Card>

          <div className="grid gap-3 md:grid-cols-3">
            {recs.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card
                  className={cn(
                    "glass-card h-full p-5",
                    r.severity === "high" && "border-destructive/40",
                    r.severity === "medium" && "border-warning/40",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest",
                        r.severity === "high" && "bg-destructive/20 text-destructive",
                        r.severity === "medium" && "bg-warning/20 text-warning",
                        r.severity === "low" && "bg-accent/20 text-accent",
                      )}
                    >
                      {r.severity}
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      €{r.impact_eur_monthly.toLocaleString()}/lună
                    </span>
                  </div>
                  <h3 className="mb-2 font-semibold">{r.title}</h3>
                  <p className="mb-3 text-xs text-muted-foreground">{r.rationale}</p>
                  <p className="text-xs"><span className="font-semibold text-foreground">Acțiune:</span> {r.action}</p>
                </Card>
              </motion.div>
            ))}
            {recs.length === 0 && !loadingRecs && (
              <Card className="glass-card col-span-full p-8 text-center text-sm text-muted-foreground">
                Apasă „Generează" pentru recomandări AI bazate pe datele tale financiare.
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scenario" className="mt-6 space-y-4">
          <Card className="glass-card p-5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Descrie scenariul în limbaj natural
            </label>
            <Textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              rows={3}
              className="mt-2"
            />
            <Button onClick={runScenario} disabled={loadingScenario} className="mt-3 bg-gradient-primary">
              {loadingScenario ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
              Rulează scenariul
            </Button>
          </Card>

          {scenarioRes && (
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="Burn nou" value={`€${scenarioRes.new_burn_eur?.toLocaleString()}`} />
              <MetricCard label="Revenue nou" value={`€${scenarioRes.new_revenue_eur?.toLocaleString()}`} />
              <MetricCard label="Runway nou" value={`${scenarioRes.new_runway_months} luni`} />
              <MetricCard label="Marjă nouă" value={`${scenarioRes.new_margin_pct}%`} />
              <Card className="glass-card col-span-full p-5">
                <h3 className="mb-2 font-semibold">Sumar</h3>
                <p className="mb-4 text-sm text-muted-foreground">{scenarioRes.summary}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-destructive">Riscuri</h4>
                    <ul className="space-y-1 text-xs">
                      {scenarioRes.risks?.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Oportunități</h4>
                    <ul className="space-y-1 text-xs">
                      {scenarioRes.opportunities?.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ebitda" className="mt-6 space-y-4">
          <Card className="glass-card flex items-center justify-between p-5">
            <div>
              <h2 className="font-display text-lg font-semibold">Pârghia KPI pe EBITDA</h2>
              <p className="text-xs text-muted-foreground">
                Pentru fiecare KPI cheie, AI estimează impactul lunar dacă îl îmbunătățești cu 10%.
              </p>
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
                  <p className="text-xs text-muted-foreground">
                    {k.current} → {k.improved_10pct} (+10%)
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Pârghie</p>
                    <p className="font-semibold text-primary">{k.leverage_score}/10</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Impact EBITDA</p>
                    <p className="font-semibold text-accent">€{k.ebitda_impact_eur_monthly?.toLocaleString()}/lună</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          {snapshot ? (
            <div className="grid gap-3 md:grid-cols-3">
              <MetricCard label="MRR" value={`€${snapshot.mrr_eur.toLocaleString()}`} />
              <MetricCard label="Burn lunar" value={`€${snapshot.monthly_burn_eur.toLocaleString()}`} />
              <MetricCard label="Runway" value={`${snapshot.runway_months} luni`} />
              <MetricCard label="CAC" value={`€${snapshot.cac_eur}`} />
              <MetricCard label="LTV" value={`€${snapshot.ltv_eur}`} />
              <MetricCard label="LTV/CAC" value={`${(snapshot.ltv_eur / snapshot.cac_eur).toFixed(1)}x`} />
              <Card className="glass-card col-span-full p-5">
                <h3 className="mb-3 font-semibold">Revenue per linie</h3>
                <div className="space-y-2">
                  {Object.entries(snapshot.revenue_streams).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{k.replace("_", " ")}</span>
                      <span className="font-semibold">€{v.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="glass-card p-8 text-center text-sm text-muted-foreground">
              Generează AI insights pentru a încărca snapshot-ul.
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="glass-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </Card>
  );
}
