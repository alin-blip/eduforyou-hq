-- Monthly snapshots table
CREATE TABLE public.monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL UNIQUE, -- "YYYY-MM"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- Finance
  revenue_total NUMERIC NOT NULL DEFAULT 0,
  expenses_total NUMERIC NOT NULL DEFAULT 0,
  net_profit NUMERIC NOT NULL DEFAULT 0,
  gross_margin_pct NUMERIC NOT NULL DEFAULT 0,
  monthly_burn NUMERIC NOT NULL DEFAULT 0,
  runway_months NUMERIC,
  cash_collected NUMERIC NOT NULL DEFAULT 0,
  -- OKR
  objectives_total INTEGER NOT NULL DEFAULT 0,
  objectives_avg_progress INTEGER NOT NULL DEFAULT 0,
  objectives_on_track INTEGER NOT NULL DEFAULT 0,
  objectives_at_risk INTEGER NOT NULL DEFAULT 0,
  objectives_off_track INTEGER NOT NULL DEFAULT 0,
  -- Tasks
  tasks_done INTEGER NOT NULL DEFAULT 0,
  tasks_created INTEGER NOT NULL DEFAULT 0,
  completion_rate NUMERIC NOT NULL DEFAULT 0,
  -- PACE
  pace_score NUMERIC NOT NULL DEFAULT 0,
  -- Per department
  departments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view snapshots"
  ON public.monthly_snapshots FOR SELECT
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Managers insert snapshots"
  ON public.monthly_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE INDEX idx_monthly_snapshots_period ON public.monthly_snapshots(period_start DESC);

-- Capture function (callable from cron and manually)
CREATE OR REPLACE FUNCTION public.capture_monthly_snapshot(_target_month DATE DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target DATE := COALESCE(_target_month, (date_trunc('month', now()) - INTERVAL '1 month')::date);
  v_period_start DATE := date_trunc('month', v_target)::date;
  v_period_end DATE := (date_trunc('month', v_target) + INTERVAL '1 month - 1 day')::date;
  v_period_label TEXT := to_char(v_period_start, 'YYYY-MM');
  v_revenue NUMERIC := 0;
  v_expenses NUMERIC := 0;
  v_burn NUMERIC := 0;
  v_cash_in NUMERIC := 0;
  v_outstanding_in NUMERIC := 0;
  v_outstanding_out NUMERIC := 0;
  v_debt_remaining NUMERIC := 0;
  v_debt_monthly NUMERIC := 0;
  v_runway NUMERIC;
  v_obj_total INTEGER := 0;
  v_obj_avg INTEGER := 0;
  v_obj_on_track INTEGER := 0;
  v_obj_at_risk INTEGER := 0;
  v_obj_off_track INTEGER := 0;
  v_tasks_done INTEGER := 0;
  v_tasks_created INTEGER := 0;
  v_completion NUMERIC := 0;
  v_pace NUMERIC := 0;
  v_departments JSONB;
  v_id UUID;
BEGIN
  -- Finance
  SELECT COALESCE(SUM(amount), 0) INTO v_revenue
  FROM revenue WHERE occurred_on BETWEEN v_period_start AND v_period_end AND status IN ('confirmed', 'received');

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expenses WHERE occurred_on BETWEEN v_period_start AND v_period_end AND status IN ('committed', 'paid');

  SELECT COALESCE(SUM(amount), 0) INTO v_burn
  FROM expenses WHERE is_recurring = true AND status IN ('committed', 'paid');

  SELECT COALESCE(SUM(amount), 0) INTO v_cash_in
  FROM invoices WHERE status = 'paid' AND paid_on BETWEEN v_period_start AND v_period_end AND kind = 'outgoing';

  SELECT COALESCE(SUM(amount), 0) INTO v_outstanding_in
  FROM invoices WHERE status IN ('sent', 'overdue') AND kind = 'outgoing';

  SELECT COALESCE(SUM(amount), 0) INTO v_outstanding_out
  FROM invoices WHERE status IN ('sent', 'overdue') AND kind = 'incoming';

  SELECT COALESCE(SUM(remaining), 0), COALESCE(SUM(monthly_payment), 0)
  INTO v_debt_remaining, v_debt_monthly
  FROM debits WHERE status = 'active';

  v_runway := CASE WHEN (v_burn + v_debt_monthly) > 0
    THEN ROUND((v_cash_in + v_outstanding_in - v_outstanding_out - v_debt_remaining) / NULLIF((v_burn + v_debt_monthly), 0), 1)
    ELSE NULL END;

  -- OKR (current state, not historical)
  SELECT COUNT(*), COALESCE(AVG(progress), 0)::int,
    COUNT(*) FILTER (WHERE status = 'on_track'),
    COUNT(*) FILTER (WHERE status = 'at_risk'),
    COUNT(*) FILTER (WHERE status = 'off_track')
  INTO v_obj_total, v_obj_avg, v_obj_on_track, v_obj_at_risk, v_obj_off_track
  FROM objectives;

  -- Tasks
  SELECT COUNT(*) FILTER (WHERE status = 'done' AND completed_at BETWEEN v_period_start AND v_period_end + INTERVAL '1 day'),
         COUNT(*) FILTER (WHERE created_at BETWEEN v_period_start AND v_period_end + INTERVAL '1 day')
  INTO v_tasks_done, v_tasks_created
  FROM tasks;

  v_completion := CASE WHEN v_tasks_created > 0
    THEN ROUND((v_tasks_done::numeric / v_tasks_created::numeric) * 100, 1)
    ELSE 0 END;

  -- PACE: weighted score (40% completion + 30% OKR avg + 30% margin)
  v_pace := ROUND(
    (v_completion * 0.4) +
    (v_obj_avg * 0.3) +
    (CASE WHEN v_revenue > 0 THEN ((v_revenue - v_expenses) / v_revenue * 100) ELSE 0 END * 0.3)
  , 1);

  -- Per department
  WITH dept_tasks AS (
    SELECT department_id,
      COUNT(*) FILTER (WHERE status = 'done' AND completed_at BETWEEN v_period_start AND v_period_end + INTERVAL '1 day') AS done,
      COUNT(*) FILTER (WHERE created_at BETWEEN v_period_start AND v_period_end + INTERVAL '1 day') AS created
    FROM tasks WHERE department_id IS NOT NULL GROUP BY department_id
  ),
  dept_exp AS (
    SELECT department_id, COALESCE(SUM(amount), 0) AS spend
    FROM expenses WHERE department_id IS NOT NULL
      AND occurred_on BETWEEN v_period_start AND v_period_end
      AND status IN ('committed', 'paid')
    GROUP BY department_id
  ),
  dept_okr AS (
    SELECT department_id, COALESCE(AVG(progress), 0)::int AS avg_progress
    FROM objectives WHERE department_id IS NOT NULL GROUP BY department_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'department_id', d.id,
    'name', d.name,
    'tasks_done', COALESCE(t.done, 0),
    'tasks_created', COALESCE(t.created, 0),
    'completion_rate', CASE WHEN COALESCE(t.created, 0) > 0
      THEN ROUND((t.done::numeric / t.created::numeric) * 100, 1) ELSE 0 END,
    'spend', COALESCE(e.spend, 0),
    'avg_okr_progress', COALESCE(o.avg_progress, 0)
  ) ORDER BY d.name) INTO v_departments
  FROM departments d
  LEFT JOIN dept_tasks t ON t.department_id = d.id
  LEFT JOIN dept_exp e ON e.department_id = d.id
  LEFT JOIN dept_okr o ON o.department_id = d.id;

  -- Upsert
  INSERT INTO public.monthly_snapshots (
    period, period_start, period_end,
    revenue_total, expenses_total, net_profit, gross_margin_pct, monthly_burn, runway_months, cash_collected,
    objectives_total, objectives_avg_progress, objectives_on_track, objectives_at_risk, objectives_off_track,
    tasks_done, tasks_created, completion_rate, pace_score, departments
  ) VALUES (
    v_period_label, v_period_start, v_period_end,
    v_revenue, v_expenses, v_revenue - v_expenses,
    CASE WHEN v_revenue > 0 THEN ROUND((v_revenue - v_expenses) / v_revenue * 100, 1) ELSE 0 END,
    v_burn, v_runway, v_cash_in,
    v_obj_total, v_obj_avg, v_obj_on_track, v_obj_at_risk, v_obj_off_track,
    v_tasks_done, v_tasks_created, v_completion, v_pace, COALESCE(v_departments, '[]'::jsonb)
  )
  ON CONFLICT (period) DO UPDATE SET
    revenue_total = EXCLUDED.revenue_total,
    expenses_total = EXCLUDED.expenses_total,
    net_profit = EXCLUDED.net_profit,
    gross_margin_pct = EXCLUDED.gross_margin_pct,
    monthly_burn = EXCLUDED.monthly_burn,
    runway_months = EXCLUDED.runway_months,
    cash_collected = EXCLUDED.cash_collected,
    objectives_total = EXCLUDED.objectives_total,
    objectives_avg_progress = EXCLUDED.objectives_avg_progress,
    objectives_on_track = EXCLUDED.objectives_on_track,
    objectives_at_risk = EXCLUDED.objectives_at_risk,
    objectives_off_track = EXCLUDED.objectives_off_track,
    tasks_done = EXCLUDED.tasks_done,
    tasks_created = EXCLUDED.tasks_created,
    completion_rate = EXCLUDED.completion_rate,
    pace_score = EXCLUDED.pace_score,
    departments = EXCLUDED.departments
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'period', v_period_label, 'pace_score', v_pace);
END;
$$;

-- Get snapshots for comparison
CREATE OR REPLACE FUNCTION public.get_snapshots_comparison(_limit integer DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT jsonb_agg(row_to_json(s) ORDER BY s.period_start ASC) INTO v_result
  FROM (
    SELECT * FROM public.monthly_snapshots
    ORDER BY period_start DESC
    LIMIT _limit
  ) s;

  RETURN jsonb_build_object('snapshots', COALESCE(v_result, '[]'::jsonb));
END;
$$;