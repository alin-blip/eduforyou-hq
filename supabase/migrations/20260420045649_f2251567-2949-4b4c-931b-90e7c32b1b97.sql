-- Enums
CREATE TYPE public.revenue_status AS ENUM ('planned', 'confirmed', 'received');
CREATE TYPE public.expense_status AS ENUM ('planned', 'committed', 'paid');
CREATE TYPE public.expense_category AS ENUM ('salaries', 'ads_meta', 'ads_google', 'ads_other', 'software', 'rent', 'utilities', 'contractors', 'travel', 'marketing', 'other');
CREATE TYPE public.invoice_kind AS ENUM ('outgoing', 'incoming');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.debit_status AS ENUM ('active', 'paid_off', 'defaulted');

-- REVENUE
CREATE TABLE public.revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  stream TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  status public.revenue_status NOT NULL DEFAULT 'confirmed',
  source TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EXPENSES
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  category public.expense_category NOT NULL DEFAULT 'other',
  vendor TEXT,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  status public.expense_status NOT NULL DEFAULT 'paid',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INVOICES
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  kind public.invoice_kind NOT NULL DEFAULT 'outgoing',
  number TEXT,
  counterparty TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  issued_on DATE NOT NULL DEFAULT CURRENT_DATE,
  due_on DATE,
  paid_on DATE,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEBITS (loans / liabilities)
CREATE TABLE public.debits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  creditor TEXT NOT NULL,
  principal NUMERIC(14,2) NOT NULL DEFAULT 0,
  remaining NUMERIC(14,2) NOT NULL DEFAULT 0,
  monthly_payment NUMERIC(14,2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  start_on DATE NOT NULL DEFAULT CURRENT_DATE,
  end_on DATE,
  next_payment_on DATE,
  status public.debit_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_revenue_occurred ON public.revenue(occurred_on DESC);
CREATE INDEX idx_revenue_entity ON public.revenue(entity_id);
CREATE INDEX idx_expenses_occurred ON public.expenses(occurred_on DESC);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due ON public.invoices(due_on);
CREATE INDEX idx_debits_status ON public.debits(status);

-- Enable RLS
ALTER TABLE public.revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debits ENABLE ROW LEVEL SECURITY;

-- Policies: only managers/executives/CEO can see line items and mutate
CREATE POLICY "Managers view revenue" ON public.revenue FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers insert revenue" ON public.revenue FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers update revenue" ON public.revenue FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Admins delete revenue" ON public.revenue FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Managers view expenses" ON public.expenses FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers insert expenses" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers update expenses" ON public.expenses FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Admins delete expenses" ON public.expenses FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Managers view invoices" ON public.invoices FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers insert invoices" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers update invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Admins delete invoices" ON public.invoices FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Managers view debits" ON public.debits FOR SELECT TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers insert debits" ON public.debits FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers update debits" ON public.debits FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Admins delete debits" ON public.debits FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

-- updated_at triggers
CREATE TRIGGER trg_revenue_updated BEFORE UPDATE ON public.revenue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_debits_updated BEFORE UPDATE ON public.debits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- P&L snapshot function — last N months
CREATE OR REPLACE FUNCTION public.get_finance_snapshot(_months INT DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start DATE := date_trunc('month', now())::date - (_months - 1) * INTERVAL '1 month';
  v_revenue NUMERIC := 0;
  v_expenses NUMERIC := 0;
  v_recurring_burn NUMERIC := 0;
  v_cash_in NUMERIC := 0;
  v_outstanding_in NUMERIC := 0;
  v_outstanding_out NUMERIC := 0;
  v_debt_remaining NUMERIC := 0;
  v_debt_monthly NUMERIC := 0;
  v_revenue_streams JSONB;
  v_expense_categories JSONB;
  v_runway NUMERIC;
  v_net NUMERIC;
BEGIN
  -- Authorization: only managers+
  IF NOT has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_revenue
  FROM revenue WHERE occurred_on >= v_period_start AND status IN ('confirmed', 'received');

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expenses WHERE occurred_on >= v_period_start AND status IN ('committed', 'paid');

  SELECT COALESCE(SUM(amount), 0) INTO v_recurring_burn
  FROM expenses WHERE is_recurring = true AND status IN ('committed', 'paid');

  SELECT COALESCE(SUM(amount), 0) INTO v_cash_in
  FROM invoices WHERE status = 'paid' AND paid_on >= v_period_start AND kind = 'outgoing';

  SELECT COALESCE(SUM(amount), 0) INTO v_outstanding_in
  FROM invoices WHERE status IN ('sent', 'overdue') AND kind = 'outgoing';

  SELECT COALESCE(SUM(amount), 0) INTO v_outstanding_out
  FROM invoices WHERE status IN ('sent', 'overdue') AND kind = 'incoming';

  SELECT COALESCE(SUM(remaining), 0), COALESCE(SUM(monthly_payment), 0)
  INTO v_debt_remaining, v_debt_monthly
  FROM debits WHERE status = 'active';

  SELECT COALESCE(jsonb_object_agg(stream, total), '{}'::jsonb) INTO v_revenue_streams
  FROM (
    SELECT stream, SUM(amount) AS total
    FROM revenue WHERE occurred_on >= v_period_start AND status IN ('confirmed', 'received')
    GROUP BY stream
  ) s;

  SELECT COALESCE(jsonb_object_agg(category, total), '{}'::jsonb) INTO v_expense_categories
  FROM (
    SELECT category::text, SUM(amount) AS total
    FROM expenses WHERE occurred_on >= v_period_start AND status IN ('committed', 'paid')
    GROUP BY category
  ) e;

  v_net := v_revenue - v_expenses;
  v_runway := CASE WHEN (v_recurring_burn + v_debt_monthly) > 0
    THEN ROUND((v_cash_in + v_outstanding_in - v_outstanding_out - v_debt_remaining) / NULLIF((v_recurring_burn + v_debt_monthly), 0), 1)
    ELSE NULL END;

  RETURN jsonb_build_object(
    'period_months', _months,
    'period_start', v_period_start,
    'revenue_total', v_revenue,
    'expenses_total', v_expenses,
    'net_profit', v_net,
    'gross_margin_pct', CASE WHEN v_revenue > 0 THEN ROUND(v_net / v_revenue * 100, 1) ELSE 0 END,
    'monthly_burn_recurring', v_recurring_burn,
    'cash_collected', v_cash_in,
    'invoices_outstanding_in', v_outstanding_in,
    'invoices_outstanding_out', v_outstanding_out,
    'debt_remaining', v_debt_remaining,
    'debt_monthly_payment', v_debt_monthly,
    'runway_months', v_runway,
    'revenue_streams', v_revenue_streams,
    'expense_categories', v_expense_categories
  );
END;
$$;