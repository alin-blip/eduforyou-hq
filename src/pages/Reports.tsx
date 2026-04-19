import { useEffect, useState } from "react";
import { BarChart3, Plus, Trash2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Benchmark {
  id: string;
  metric: string;
  industry: string;
  value: number;
  unit: string | null;
  source: string | null;
}

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ metric: "", industry: "EdTech", value: 0, unit: "", source: "" });

  const load = async () => {
    const { data } = await supabase.from("benchmarks").select("*").order("metric");
    if (data) setBenchmarks(data as Benchmark[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.metric.trim()) return;
    const { error } = await supabase.from("benchmarks").insert(draft);
    if (error) return toast.error(error.message);
    setOpen(false);
    setDraft({ metric: "", industry: "EdTech", value: 0, unit: "", source: "" });
    await load();
    toast.success("Benchmark adăugat");
  };

  const remove = async (id: string) => {
    await supabase.from("benchmarks").delete().eq("id", id);
    await load();
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs">
          <BarChart3 className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Reports & Benchmarks</span>
        </div>
        <h1 className="font-display text-3xl font-semibold">360° Comparison</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Benchmark-uri industrie și snapshot-uri lunare. PDF Board Report în Val 3.
        </p>
      </header>

      <Tabs defaultValue="benchmarks">
        <TabsList className="bg-card/60">
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots lunare</TabsTrigger>
        </TabsList>

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

        <TabsContent value="snapshots" className="mt-6">
          <Card className="glass-card flex flex-col items-center justify-center gap-3 p-12 text-center">
            <TrendingUp className="h-10 w-10 text-primary opacity-60" />
            <h3 className="font-display text-lg font-semibold">Snapshots lunare — Val 3</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Vor stoca automat la finalul fiecărei luni: PACE score, financials, OKR completion, marketing performance.
              Comparație lună-pe-lună cu export PDF Board Report.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
