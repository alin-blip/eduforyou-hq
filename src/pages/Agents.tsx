import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Save } from "lucide-react";
import { useAgents, useUpsertAgent, useAgentReferrals, type Agent, type AgentStatus } from "@/hooks/useAgents";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const STATUS_VARIANT: Record<AgentStatus, "default" | "secondary" | "outline" | "destructive"> = {
  applied: "outline",
  approved: "secondary",
  active: "default",
  inactive: "destructive",
};

export default function AgentsPage() {
  const { data: agents = [], isLoading } = useAgents();
  const { data: referrals = [] } = useAgentReferrals();
  const [openNew, setOpenNew] = useState(false);

  const activeCount = agents.filter((a) => a.status === "active").length;
  const enrolled = referrals.filter((r) => r.status === "enrolled").length;
  const owed = referrals.filter((r) => !r.commission_paid).reduce((s, r) => s + (r.commission_amount ?? 0), 0);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Recrutare, performanță și comisioane agenți (Dalina).</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Adaugă agent</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agent nou</DialogTitle></DialogHeader>
            <AgentForm onDone={() => setOpenNew(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Agenți activi" value={activeCount} />
        <Stat label="Total agenți" value={agents.length} />
        <Stat label="Studenți înrolați" value={enrolled} />
        <Stat label="Comisioane datorate" value={`£${owed.toLocaleString()}`} />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2">Nume</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Telefon</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Referrals</th>
                <th className="px-4 py-2 text-right">Înrolați</th>
                <th className="px-4 py-2 text-right">Comision %</th>
              </tr></thead>
              <tbody>
                {agents.map((a) => {
                  const r = referrals.filter((x) => x.agent_id === a.id);
                  const e = r.filter((x) => x.status === "enrolled").length;
                  return (
                    <tr key={a.id} className="border-b">
                      <td className="px-4 py-2 font-medium">{a.name}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{a.email ?? "—"}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{a.phone ?? "—"}</td>
                      <td className="px-4 py-2"><Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge></td>
                      <td className="px-4 py-2 text-right tabular-nums">{r.length}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{e}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{a.commission_pct ?? 0}%</td>
                    </tr>
                  );
                })}
                {agents.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Niciun agent încă.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</p>
    </CardContent></Card>
  );
}

function AgentForm({ onDone }: { onDone: () => void }) {
  const upsert = useUpsertAgent();
  const [a, setA] = useState<Partial<Agent>>({ name: "", email: "", phone: "", status: "applied", commission_pct: 10 });
  return (
    <div className="space-y-3">
      <Input placeholder="Nume" value={a.name ?? ""} onChange={(e) => setA((p) => ({ ...p, name: e.target.value }))} />
      <Input placeholder="Email" value={a.email ?? ""} onChange={(e) => setA((p) => ({ ...p, email: e.target.value }))} />
      <Input placeholder="Telefon" value={a.phone ?? ""} onChange={(e) => setA((p) => ({ ...p, phone: e.target.value }))} />
      <Input type="number" placeholder="Comision %" value={a.commission_pct ?? 0} onChange={(e) => setA((p) => ({ ...p, commission_pct: Number(e.target.value) }))} />
      <Button
        className="w-full"
        disabled={!a.name}
        onClick={async () => {
          if (!a.name) return;
          await upsert.mutateAsync({ name: a.name, email: a.email, phone: a.phone, status: a.status as AgentStatus, commission_pct: a.commission_pct });
          onDone();
        }}
      ><Save className="mr-2 h-4 w-4" /> Salvează</Button>
    </div>
  );
}
