import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Mode = "revenue" | "expense" | "invoice" | "debit";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
  initial?: any;
  onSubmit: (payload: any) => void;
}

const empty = {
  revenue: { stream: "", amount: 0, occurred_on: new Date().toISOString().slice(0, 10), status: "confirmed", source: "", notes: "" },
  expense: { category: "other", vendor: "", description: "", amount: 0, occurred_on: new Date().toISOString().slice(0, 10), is_recurring: false, status: "paid" },
  invoice: { kind: "outgoing", number: "", counterparty: "", amount: 0, issued_on: new Date().toISOString().slice(0, 10), due_on: "", status: "draft", notes: "" },
  debit: { creditor: "", principal: 0, remaining: 0, monthly_payment: 0, interest_rate: 0, start_on: new Date().toISOString().slice(0, 10), status: "active", notes: "" },
};

export function FinanceDialog({ open, onOpenChange, mode, initial, onSubmit }: Props) {
  const [form, setForm] = useState<any>(empty[mode]);

  useEffect(() => {
    setForm(initial ?? empty[mode]);
  }, [initial, mode, open]);

  const titles: Record<Mode, string> = {
    revenue: initial ? "Editează venit" : "Adaugă venit",
    expense: initial ? "Editează cheltuială" : "Adaugă cheltuială",
    invoice: initial ? "Editează factură" : "Adaugă factură",
    debit: initial ? "Editează datorie" : "Adaugă datorie",
  };

  const handleSubmit = () => {
    const payload = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });
    onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {mode === "revenue" && (
            <>
              <Field label="Linie de venit"><Input value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} placeholder="ex: B2C, Agent Hub" /></Field>
              <Field label="Sumă (€)"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Data"><Input type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planificat</SelectItem>
                    <SelectItem value="confirmed">Confirmat</SelectItem>
                    <SelectItem value="received">Încasat</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Sursă"><Input value={form.source ?? ""} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="ex: Stripe, Bank transfer" /></Field>
              <Field label="Note"><Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></Field>
            </>
          )}

          {mode === "expense" && (
            <>
              <Field label="Categorie">
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["salaries", "ads_meta", "ads_google", "ads_other", "software", "rent", "utilities", "contractors", "travel", "marketing", "other"].map((c) => (
                      <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Vendor"><Input value={form.vendor ?? ""} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></Field>
              <Field label="Descriere"><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label="Sumă (€)"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Data"><Input type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} /></Field>
              <div className="flex items-center justify-between rounded-lg border border-border/40 p-3">
                <Label>Cheltuială recurentă (lunară)</Label>
                <Switch checked={form.is_recurring} onCheckedChange={(v) => setForm({ ...form, is_recurring: v })} />
              </div>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planificat</SelectItem>
                    <SelectItem value="committed">Angajat</SelectItem>
                    <SelectItem value="paid">Plătit</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {mode === "invoice" && (
            <>
              <Field label="Tip">
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">Emisă (de încasat)</SelectItem>
                    <SelectItem value="incoming">Primită (de plătit)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Număr"><Input value={form.number ?? ""} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
              <Field label="Contraparte"><Input value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} /></Field>
              <Field label="Sumă (€)"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Emisă pe"><Input type="date" value={form.issued_on} onChange={(e) => setForm({ ...form, issued_on: e.target.value })} /></Field>
              <Field label="Scadență"><Input type="date" value={form.due_on ?? ""} onChange={(e) => setForm({ ...form, due_on: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Trimisă</SelectItem>
                    <SelectItem value="paid">Plătită</SelectItem>
                    <SelectItem value="overdue">Restantă</SelectItem>
                    <SelectItem value="cancelled">Anulată</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}

          {mode === "debit" && (
            <>
              <Field label="Creditor"><Input value={form.creditor} onChange={(e) => setForm({ ...form, creditor: e.target.value })} /></Field>
              <Field label="Principal (€)"><Input type="number" value={form.principal} onChange={(e) => setForm({ ...form, principal: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Sold rămas (€)"><Input type="number" value={form.remaining} onChange={(e) => setForm({ ...form, remaining: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Plată lunară (€)"><Input type="number" value={form.monthly_payment} onChange={(e) => setForm({ ...form, monthly_payment: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Dobândă anuală (%)"><Input type="number" step="0.1" value={form.interest_rate ?? 0} onChange={(e) => setForm({ ...form, interest_rate: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Început"><Input type="date" value={form.start_on} onChange={(e) => setForm({ ...form, start_on: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activ</SelectItem>
                    <SelectItem value="paid_off">Achitat</SelectItem>
                    <SelectItem value="defaulted">Restant</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anulează</Button>
          <Button onClick={handleSubmit} className="bg-gradient-primary">Salvează</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
