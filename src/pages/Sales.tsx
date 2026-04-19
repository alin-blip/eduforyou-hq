import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEntity } from "@/hooks/useEntity";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Stage {
  id: string;
  name: string;
  position: number;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
  color: string;
}

interface Deal {
  id: string;
  title: string;
  company_name: string | null;
  value: number;
  currency: string;
  stage_id: string | null;
  status: "open" | "won" | "lost";
  source: string | null;
  expected_close: string | null;
  owner_id: string | null;
}

const SOURCES = ["organic", "meta_ads", "google_ads", "ghl", "referral", "partners", "outbound"];

export default function SalesPage() {
  const { current } = useEntity();
  const { user } = useAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    company_name: "",
    value: 0,
    stage_id: "",
    source: "organic",
    expected_close: "",
  });

  const load = async () => {
    if (!current) return;
    const [{ data: s }, { data: d }] = await Promise.all([
      supabase.from("pipeline_stages").select("*").eq("entity_id", current.id).order("position"),
      supabase.from("deals").select("*").eq("entity_id", current.id),
    ]);
    if (s) setStages(s as Stage[]);
    if (d) setDeals(d as Deal[]);
  };

  useEffect(() => {
    load();
  }, [current]);

  const totalPipeline = deals
    .filter((d) => d.status === "open")
    .reduce((sum, d) => sum + Number(d.value), 0);
  const weighted = deals
    .filter((d) => d.status === "open")
    .reduce((sum, d) => {
      const st = stages.find((s) => s.id === d.stage_id);
      return sum + (Number(d.value) * (st?.probability ?? 0)) / 100;
    }, 0);
  const wonMtd = deals
    .filter((d) => d.status === "won")
    .reduce((sum, d) => sum + Number(d.value), 0);

  const moveDeal = async (dealId: string, stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    const status = stage?.is_won ? "won" : stage?.is_lost ? "lost" : "open";
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage_id: stageId, status } : d)));
    await supabase.from("deals").update({ stage_id: stageId, status }).eq("id", dealId);
  };

  const create = async () => {
    if (!current || !user || !draft.title.trim()) return;
    const stage_id = draft.stage_id || stages[0]?.id;
    const { data, error } = await supabase
      .from("deals")
      .insert({
        entity_id: current.id,
        title: draft.title,
        company_name: draft.company_name || null,
        value: draft.value,
        stage_id,
        source: draft.source,
        expected_close: draft.expected_close || null,
        owner_id: user.id,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    if (data) setDeals((prev) => [...prev, data as Deal]);
    setOpen(false);
    setDraft({ title: "", company_name: "", value: 0, stage_id: "", source: "organic", expected_close: "" });
    toast.success("Deal creat");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs">
            <TrendingUp className="h-3 w-3 text-accent" />
            <span className="text-muted-foreground">Sales Pipeline</span>
          </div>
          <h1 className="font-display text-3xl font-semibold">Pipeline & Forecast</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mută deal-urile între etape. Forecast-ul ponderat se actualizează în timp real.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" /> Deal nou
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deal nou</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Titlu deal"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Input
                placeholder="Companie"
                value={draft.company_name}
                onChange={(e) => setDraft({ ...draft, company_name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Valoare €"
                  value={draft.value || ""}
                  onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })}
                />
                <Input
                  type="date"
                  value={draft.expected_close}
                  onChange={(e) => setDraft({ ...draft, expected_close: e.target.value })}
                />
              </div>
              <Select value={draft.source} onValueChange={(v) => setDraft({ ...draft, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={draft.stage_id || stages[0]?.id} onValueChange={(v) => setDraft({ ...draft, stage_id: v })}>
                <SelectTrigger><SelectValue placeholder="Etapă" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={create} className="w-full bg-gradient-primary">Creează</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Pipeline total" value={totalPipeline} icon={<DollarSign className="h-4 w-4 text-primary" />} />
        <SummaryCard label="Forecast ponderat" value={weighted} icon={<TrendingUp className="h-4 w-4 text-accent" />} />
        <SummaryCard label="Won MTD" value={wonMtd} icon={<DollarSign className="h-4 w-4 text-accent" />} accent />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage_id === stage.id);
          const stageTotal = stageDeals.reduce((s, d) => s + Number(d.value), 0);
          return (
            <div
              key={stage.id}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-border/50 bg-card/30 p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("dealId");
                if (id) moveDeal(id, stage.id);
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", stage.is_won ? "bg-accent" : stage.is_lost ? "bg-destructive" : "bg-primary")} />
                  <h3 className="text-sm font-semibold">{stage.name}</h3>
                  <Badge variant="secondary" className="text-[10px]">{stage.probability}%</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{stageDeals.length}</span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">€{stageTotal.toLocaleString()}</p>
              <div className="flex-1 space-y-2">
                {stageDeals.map((deal) => (
                  <motion.div
                    key={deal.id}
                    layout
                    draggable
                    onDragStart={(e: any) => e.dataTransfer.setData("dealId", deal.id)}
                    className="cursor-grab rounded-lg border border-border/50 bg-card p-3 shadow-card transition-all hover:border-primary/40 active:cursor-grabbing"
                  >
                    <p className="line-clamp-1 text-sm font-medium">{deal.title}</p>
                    {deal.company_name && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{deal.company_name}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary">€{Number(deal.value).toLocaleString()}</span>
                      {deal.source && <Badge variant="outline" className="text-[9px]">{deal.source}</Badge>}
                    </div>
                  </motion.div>
                ))}
                {stageDeals.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/40 py-6 text-center text-xs text-muted-foreground">
                    Drag deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={cn("glass-card p-5", accent && "border-accent/30")}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">€{value.toLocaleString()}</p>
    </Card>
  );
}
