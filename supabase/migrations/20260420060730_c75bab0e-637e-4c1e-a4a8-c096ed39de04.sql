-- Enable pg_cron + pg_net pentru job-uri programate
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Variantă internă fără verificare de rol (folosită doar de cron-ul intern)
CREATE OR REPLACE FUNCTION public.sync_project_metrics_internal()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_synced INTEGER := 0;
  v_project RECORD;
  v_value NUMERIC;
  v_prev NUMERIC;
  v_delta NUMERIC;
  v_dept_id UUID;
  v_period_start DATE := date_trunc('month', now())::date;
  v_prev_period_start DATE := (date_trunc('month', now()) - INTERVAL '1 month')::date;
BEGIN
  FOR v_project IN SELECT id, slug FROM public.projects LOOP
    IF v_project.slug IN ('sales', 'sales-pipeline') THEN
      SELECT COUNT(*) INTO v_value FROM deals WHERE status = 'open';
      INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, position, recorded_at)
      VALUES (v_project.id, 'open_deals', 'Deals deschise', v_value, NULL, 0, now())
      ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, recorded_at = now(), updated_at = now();

      SELECT COALESCE(SUM(value), 0) INTO v_value FROM deals WHERE status = 'open';
      INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, position, recorded_at)
      VALUES (v_project.id, 'pipeline_value', 'Pipeline value', v_value, '€', 1, now())
      ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, recorded_at = now(), updated_at = now();

      SELECT COALESCE(SUM(value), 0) INTO v_value FROM deals WHERE status = 'won' AND updated_at >= v_period_start;
      SELECT COALESCE(SUM(value), 0) INTO v_prev FROM deals WHERE status = 'won' AND updated_at >= v_prev_period_start AND updated_at < v_period_start;
      v_delta := CASE WHEN v_prev > 0 THEN ROUND(((v_value - v_prev) / v_prev * 100)::numeric, 1) ELSE NULL END;
      INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, delta_pct, trend, position, recorded_at)
      VALUES (v_project.id, 'won_mtd', 'Won MTD', v_value, '€', v_delta,
        CASE WHEN v_delta > 0 THEN 'up' WHEN v_delta < 0 THEN 'down' ELSE 'flat' END, 2, now())
      ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, delta_pct = EXCLUDED.delta_pct, trend = EXCLUDED.trend, recorded_at = now(), updated_at = now();
      v_synced := v_synced + 3;
    END IF;

    IF v_project.slug = 'agent-hub' THEN
      SELECT id INTO v_dept_id FROM departments WHERE slug = 'agent-hub' LIMIT 1;
      IF v_dept_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_value FROM profiles WHERE department_id = v_dept_id;
        INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, position, recorded_at)
        VALUES (v_project.id, 'members', 'Agenți', v_value, NULL, 0, now())
        ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, recorded_at = now(), updated_at = now();

        SELECT COUNT(*) INTO v_value FROM tasks WHERE department_id = v_dept_id AND status = 'done' AND completed_at >= v_period_start;
        INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, position, recorded_at)
        VALUES (v_project.id, 'tasks_done_mtd', 'Tasks done MTD', v_value, NULL, 1, now())
        ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, recorded_at = now(), updated_at = now();
        v_synced := v_synced + 2;
      END IF;
    END IF;

    IF v_project.slug = 'partners-saas' THEN
      SELECT id INTO v_dept_id FROM departments WHERE slug IN ('partners', 'partners-saas') LIMIT 1;
      IF v_dept_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_value FROM profiles WHERE department_id = v_dept_id;
        INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, position, recorded_at)
        VALUES (v_project.id, 'members', 'Parteneri', v_value, NULL, 0, now())
        ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, recorded_at = now(), updated_at = now();
        v_synced := v_synced + 1;
      END IF;
      SELECT COALESCE(SUM(amount), 0) INTO v_value FROM revenue
      WHERE occurred_on >= v_period_start AND status IN ('confirmed', 'received') AND lower(stream) LIKE '%partner%';
      INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, position, recorded_at)
      VALUES (v_project.id, 'revenue_mtd', 'Revenue MTD', v_value, '€', 1, now())
      ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, recorded_at = now(), updated_at = now();
      v_synced := v_synced + 1;
    END IF;

    IF v_project.slug = 'webinar' THEN
      SELECT id INTO v_dept_id FROM departments WHERE slug = 'webinar' LIMIT 1;
      IF v_dept_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_value FROM tasks WHERE department_id = v_dept_id AND status = 'done' AND completed_at >= v_period_start;
        INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, position, recorded_at)
        VALUES (v_project.id, 'tasks_done_mtd', 'Webinare livrate', v_value, NULL, 0, now())
        ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, recorded_at = now(), updated_at = now();
        v_synced := v_synced + 1;
      END IF;
      SELECT COALESCE(SUM(amount), 0) INTO v_value FROM revenue
      WHERE occurred_on >= v_period_start AND status IN ('confirmed', 'received') AND lower(stream) LIKE '%webinar%';
      INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, position, recorded_at)
      VALUES (v_project.id, 'revenue_mtd', 'Revenue MTD', v_value, '€', 1, now())
      ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, recorded_at = now(), updated_at = now();
      v_synced := v_synced + 1;
    END IF;

    IF v_project.slug = 'eduforyou-main' THEN
      SELECT COALESCE(SUM(amount), 0) INTO v_value FROM revenue
      WHERE occurred_on >= v_period_start AND status IN ('confirmed', 'received')
        AND (lower(stream) LIKE '%b2c%' OR lower(stream) LIKE '%course%' OR lower(stream) LIKE '%curs%');
      SELECT COALESCE(SUM(amount), 0) INTO v_prev FROM revenue
      WHERE occurred_on >= v_prev_period_start AND occurred_on < v_period_start
        AND status IN ('confirmed', 'received')
        AND (lower(stream) LIKE '%b2c%' OR lower(stream) LIKE '%course%' OR lower(stream) LIKE '%curs%');
      v_delta := CASE WHEN v_prev > 0 THEN ROUND(((v_value - v_prev) / v_prev * 100)::numeric, 1) ELSE NULL END;
      INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, delta_pct, trend, position, recorded_at)
      VALUES (v_project.id, 'revenue_b2c_mtd', 'Revenue B2C MTD', v_value, '€', v_delta,
        CASE WHEN v_delta > 0 THEN 'up' WHEN v_delta < 0 THEN 'down' ELSE 'flat' END, 0, now())
      ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, delta_pct = EXCLUDED.delta_pct, trend = EXCLUDED.trend, recorded_at = now(), updated_at = now();

      SELECT COUNT(*) INTO v_value FROM tasks WHERE status = 'done' AND completed_at >= v_period_start;
      INSERT INTO public.project_metrics (project_id, metric_key, label, value, unit, position, recorded_at)
      VALUES (v_project.id, 'tasks_done_mtd', 'Tasks done global', v_value, NULL, 1, now())
      ON CONFLICT (project_id, metric_key) DO UPDATE SET value = EXCLUDED.value, recorded_at = now(), updated_at = now();
      v_synced := v_synced + 2;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('synced', v_synced, 'at', now());
END;
$function$;