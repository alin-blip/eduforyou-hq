import { useEffect, useState } from "react";
import { BarChart3, Plus, Trash2, Sparkles, FileDown, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  DepartmentComparison,
  type DepartmentPerformance,
} from "@/components/reports/DepartmentComparison";
import { WeeklySummary, type WeeklyReport } from "@/components/reports/WeeklySummary";
import { SnapshotsComparison } from "@/components/reports/SnapshotsComparison";
import { exportReportsPdf } from "@/lib/reportsPdf";

interface Benchmark {
  id: string;
  metric: string;
  industry: string;
  value: number;
  unit: string | null;
  source: string | null;
}

type PeriodMonths = 1 | 3 | 6 | 12;

const PERIOD_LABELS: Record<PeriodMonths, string> = {
  1: "Ultima lună",
  3: "Ultimele 3 luni",
  6: "Ultimele 6 luni",
  12: "Ultimele 12 luni",
};

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ metric: "", industry: "EdTech", value: 0, unit: "", source: "" });

  const [period, setPeriod] = useState<PeriodMonths>(1);
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [loadingDept, setLoadingDept] = useState(true);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const loadBenchmarks = async () => {
    const { data } = await supabase.from("benchmarks").select("*").order("metric");
    if (data) setBenchmarks(data as Benchmark[]);
  };

  const loadDepartments = async (months: PeriodMonths = period) => {
    setLoadingDept(true);
    const { data, error } = await supabase.rpc("get_department_performance", { _months: months });
    if (error) {
      toast.error(error.message);
    } else if ((data as any)?.error === "forbidden") {
      toast.error("Doar managerii și executivii pot vizualiza acest raport.");
    } else {
      setDepartments(((data as any)?.departments ?? []) as DepartmentPerformance[]);
    }
    setLoadingDept(false);
  };

  useEffect(() => {
    loadBenchmarks();
  }, []);

  useEffect(() => {
    loadDepartments(period);
    // Clear AI report on period change so users regenerate for the new window
    setReport(null);
    setGeneratedAt(null);
  }, [period]);

  const generateAiReport = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reports-weekly-summary", {
        body: { months: period },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setReport((data as any).report as WeeklyReport);
      setGeneratedAt((data as any).generated_at as string);
      toast.success(`Summary generat pe ${PERIOD_LABELS[period].toLowerCase()}`);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("Rate limit")) toast.error("Rate limit AI. Încearcă peste un minut.");
      else if (msg.includes("Credit")) toast.error("Credit AI epuizat. Settings → Workspace → Usage.");
      else toast.error(msg || "Eroare la generarea raportului");
    } finally {
      setAiLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (departments.length === 0) {
      toast.error("Datele departamentelor nu s-au încărcat.");
      return;
    }
    setPdfLoading(true);
    try {
      exportReportsPdf({ departments, report, generatedAt });
      toast.success("PDF descărcat");
    } catch (e: any) {
      toast.error(e?.message ?? "Eroare la export PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const create = async () => {
    if (!draft.metric.trim()) return;
    const { error } = await supabase.from("benchmarks").insert(draft);
    if (error) return toast.error(error.message);
    setOpen(false);
    setDraft({ metric: "", industry: "EdTech", value: 0, unit: "", source: "" });
    await loadBenchmarks();
    toast.success("Benchmark adăugat");
  };

  const remove = async (id: string) => {
    await supabase.from("benchmarks").delete().eq("id", id);
    await loadBenchmarks();
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs">
            <BarChart3 className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Reports & 360°</span>
          </div>
          <h1 className="font-display text-3xl font-semibold">Executive 360° Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performanță departamente, AI summary și snapshot-uri lunare automate.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(period)} onValueChange={(v) => setPeriod(Number(v) as PeriodMonths)}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {([1, 3, 6, 12] as PeriodMonths[]).map((m) => (
                <SelectItem key={m} value={String(m)}>{PERIOD_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadDepartments()} disabled={loadingDept} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loadingDept ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button
            variant="outline"
            onClick={generateAiReport}
            disabled={aiLoading}
            className="gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
          >
            <Sparkles className={`h-4 w-4 ${aiLoading ? "animate-pulse" : ""}`} />
            {aiLoading ? "AI generează…" : report ? "Regenerează AI" : "Generează AI summary"}
          </Button>
          <Button
            onClick={downloadPdf}
            disabled={pdfLoading || loadingDept}
            className="gap-2 bg-gradient-primary text-primary-foreground"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList className="bg-card/60">
          <TabsTrigger value="overview">360° Overview</TabsTrigger>
          <TabsTrigger value="ai">AI Summary</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="mb-3 text-xs text-muted-foreground">
            Date agregate pe <span className="font-medium text-foreground">{PERIOD_LABELS[period].toLowerCase()}</span>
          </div>
          {loadingDept ? (
            <Card className="p-12 text-center text-sm text-muted-foreground">Se încarcă datele…</Card>
          ) : (
            <DepartmentComparison departments={departments} />
          )}
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <div className="mb-3 text-xs text-muted-foreground">
            AI analizează <span className="font-medium text-foreground">{PERIOD_LABELS[period].toLowerCase()}</span>
          </div>
          <WeeklySummary report={report} loading={aiLoading} generatedAt={generatedAt} />
        </TabsContent>

        <TabsContent value="snapshots" className="mt-6">
          <SnapshotsComparison />
        </TabsContent>

        <TabsContent value="benchmarks" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" /> Adaugă benchmark</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Benchmark nou</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Metrică (ex: CAC)" value={draft.metric} onChange={(e) => setDraft({ ...draft, metric: e.target.value })} />
                  <Input placeholder="Industrie" value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Valoare" value={draft.value || ""} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })} />
                    <Input placeholder="Unitate (€, %, x)" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
                  </div>
                  <Input placeholder="Sursă" value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} />
                  <Button onClick={create} className="w-full bg-gradient-primary">Adaugă</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="glass-card overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-border/50 bg-muted/20">
                <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3">Metrică</th>
                  <th className="px-4 py-3">Industrie</th>
                  <th className="px-4 py-3 text-right">Valoare</th>
                  <th className="px-4 py-3">Sursă</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((b) => (
                  <tr key={b.id} className="border-b border-border/30 text-sm hover:bg-card/40">
                    <td className="px-4 py-3 font-medium">{b.metric}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.industry}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {b.value.toLocaleString()} {b.unit}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.source}</td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => remove(b.id)} className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
