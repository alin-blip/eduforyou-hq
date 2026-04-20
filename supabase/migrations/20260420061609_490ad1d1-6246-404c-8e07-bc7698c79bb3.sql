-- Aggregated department performance for /reports 360° comparison
CREATE OR REPLACE FUNCTION public.get_department_performance(_months integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start DATE := (date_trunc('month', now()) - (_months - 1) * INTERVAL '1 month')::date;
  v_result JSONB;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  WITH dept_tasks AS (
    SELECT
      department_id,
      COUNT(*) FILTER (WHERE status = 'done' AND completed_at >= v_period_start) AS done_count,
      COUNT(*) FILTER (WHERE created_at >= v_period_start) AS created_count,
      COUNT(*) FILTER (WHERE status NOT IN ('done', 'blocked') AND due_date < CURRENT_DATE) AS overdue_count,
      COALESCE(SUM(logged_hours) FILTER (WHERE completed_at >= v_period_start), 0) AS hours_logged,
      COUNT(*) AS total_tasks
    FROM public.tasks
    WHERE department_id IS NOT NULL
    GROUP BY department_id
  ),
  dept_expenses AS (
    SELECT
      department_id,
      COALESCE(SUM(amount), 0) AS spend
    FROM public.expenses
    WHERE department_id IS NOT NULL
      AND occurred_on >= v_period_start
      AND status IN ('committed', 'paid')
    GROUP BY department_id
  ),
  dept_headcount AS (
    SELECT
      department_id,
      COUNT(*) AS headcount,
      COALESCE(SUM(monthly_cost), 0) AS payroll
    FROM public.profiles
    WHERE department_id IS NOT NULL
    GROUP BY department_id
  ),
  dept_okr AS (
    SELECT
      department_id,
      COUNT(*) AS objectives_total,
      COALESCE(AVG(progress), 0)::int AS avg_progress,
      COUNT(*) FILTER (WHERE status = 'on_track') AS on_track,
      COUNT(*) FILTER (WHERE status = 'at_risk') AS at_risk,
      COUNT(*) FILTER (WHERE status = 'off_track') AS off_track
    FROM public.objectives
    WHERE department_id IS NOT NULL
    GROUP BY department_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'department_id', d.id,
      'name', d.name,
      'slug', d.slug,
      'color', d.color,
      'icon', d.icon,
      'budget_monthly', COALESCE(d.budget_monthly, 0),
      'headcount', COALESCE(h.headcount, 0),
      'payroll', COALESCE(h.payroll, 0),
      'tasks_done', COALESCE(t.done_count, 0),
      'tasks_created', COALESCE(t.created_count, 0),
      'tasks_overdue', COALESCE(t.overdue_count, 0),
      'tasks_total', COALESCE(t.total_tasks, 0),
      'completion_rate', CASE
        WHEN COALESCE(t.created_count, 0) > 0
          THEN ROUND((t.done_count::numeric / t.created_count::numeric) * 100, 1)
        ELSE 0
      END,
      'hours_logged', COALESCE(t.hours_logged, 0),
      'spend', COALESCE(e.spend, 0),
      'budget_used_pct', CASE
        WHEN COALESCE(d.budget_monthly, 0) > 0
          THEN ROUND((COALESCE(e.spend, 0) / d.budget_monthly) * 100, 1)
        ELSE 0
      END,
      'objectives_total', COALESCE(o.objectives_total, 0),
      'avg_progress', COALESCE(o.avg_progress, 0),
      'on_track', COALESCE(o.on_track, 0),
      'at_risk', COALESCE(o.at_risk, 0),
      'off_track', COALESCE(o.off_track, 0)
    )
    ORDER BY d.name
  )
  INTO v_result
  FROM public.departments d
  LEFT JOIN dept_tasks t ON t.department_id = d.id
  LEFT JOIN dept_expenses e ON e.department_id = d.id
  LEFT JOIN dept_headcount h ON h.department_id = d.id
  LEFT JOIN dept_okr o ON o.department_id = d.id;

  RETURN jsonb_build_object(
    'period_months', _months,
    'period_start', v_period_start,
    'departments', COALESCE(v_result, '[]'::jsonb)
  );
END;
$$;