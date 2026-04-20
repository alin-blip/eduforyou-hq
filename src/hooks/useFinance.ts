import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RevenueRow = {
  id: string;
  stream: string;
  amount: number;
  currency: string;
  occurred_on: string;
  status: "planned" | "confirmed" | "received";
  source: string | null;
  notes: string | null;
};

export type ExpenseRow = {
  id: string;
  category: string;
  vendor: string | null;
  description: string | null;
  amount: number;
  currency: string;
  occurred_on: string;
  is_recurring: boolean;
  status: "planned" | "committed" | "paid";
  department_id: string | null;
};

export type InvoiceRow = {
  id: string;
  kind: "outgoing" | "incoming";
  number: string | null;
  counterparty: string;
  amount: number;
  currency: string;
  issued_on: string;
  due_on: string | null;
  paid_on: string | null;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  notes: string | null;
};

export type DebitRow = {
  id: string;
  creditor: string;
  principal: number;
  remaining: number;
  monthly_payment: number;
  interest_rate: number | null;
  currency: string;
  start_on: string;
  end_on: string | null;
  next_payment_on: string | null;
  status: "active" | "paid_off" | "defaulted";
  notes: string | null;
};

export type FinanceSnapshot = {
  period_months: number;
  revenue_total: number;
  expenses_total: number;
  net_profit: number;
  gross_margin_pct: number;
  monthly_burn_recurring: number;
  cash_collected: number;
  invoices_outstanding_in: number;
  invoices_outstanding_out: number;
  debt_remaining: number;
  debt_monthly_payment: number;
  runway_months: number | null;
  revenue_streams: Record<string, number>;
  expense_categories: Record<string, number>;
};

export function useFinance() {
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [debits, setDebits] = useState<DebitRow[]>([]);
  const [snapshot, setSnapshot] = useState<FinanceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [rev, exp, inv, deb, snap] = await Promise.all([
      supabase.from("revenue").select("*").order("occurred_on", { ascending: false }).limit(500),
      supabase.from("expenses").select("*").order("occurred_on", { ascending: false }).limit(500),
      supabase.from("invoices").select("*").order("issued_on", { ascending: false }).limit(500),
      supabase.from("debits").select("*").order("created_at", { ascending: false }),
      supabase.rpc("get_finance_snapshot", { _months: 1 }),
    ]);
    if (rev.data) setRevenue(rev.data as any);
    if (exp.data) setExpenses(exp.data as any);
    if (inv.data) setInvoices(inv.data as any);
    if (deb.data) setDebits(deb.data as any);
    if (snap.data && !(snap.data as any)?.error) setSnapshot(snap.data as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const insert = async (table: "revenue" | "expenses" | "invoices" | "debits", payload: any) => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from(table).insert({ ...payload, created_by: user.user?.id });
    if (error) return toast.error(error.message);
    toast.success("Adăugat");
    await refresh();
  };

  const update = async (table: "revenue" | "expenses" | "invoices" | "debits", id: string, payload: any) => {
    const { error } = await supabase.from(table).update(payload).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Actualizat");
    await refresh();
  };

  const remove = async (table: "revenue" | "expenses" | "invoices" | "debits", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Șters");
    await refresh();
  };

  return { revenue, expenses, invoices, debits, snapshot, loading, refresh, insert, update, remove };
}
