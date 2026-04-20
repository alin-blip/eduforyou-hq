-- 1. Create report_schedule table (single-row config)
CREATE TABLE IF NOT EXISTS public.report_schedule (
  id INTEGER PRIMARY KEY DEFAULT 1,
  day_of_week SMALLINT NOT NULL DEFAULT 1, -- 0=Sun..6=Sat (cron: 0-6)
  hour SMALLINT NOT NULL DEFAULT 8,
  minute SMALLINT NOT NULL DEFAULT 0,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT report_schedule_singleton CHECK (id = 1),
  CONSTRAINT report_schedule_dow_chk CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT report_schedule_hour_chk CHECK (hour BETWEEN 0 AND 23),
  CONSTRAINT report_schedule_minute_chk CHECK (minute BETWEEN 0 AND 59)
);

ALTER TABLE public.report_schedule ENABLE ROW LEVEL SECURITY;

-- Only CEO/Executive can view or change
CREATE POLICY "report_schedule_select_admins" ON public.report_schedule
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role]));

-- No direct INSERT/UPDATE/DELETE — must go through SECURITY DEFINER RPC
-- (this prevents users from bypassing the cron sync logic)

-- Seed default row
INSERT INTO public.report_schedule (id, day_of_week, hour, minute, timezone, active)
VALUES (1, 1, 8, 0, 'UTC', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Read RPC
CREATE OR REPLACE FUNCTION public.get_weekly_report_schedule()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row report_schedule%ROWTYPE;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role]) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT * INTO v_row FROM public.report_schedule WHERE id = 1;

  RETURN jsonb_build_object(
    'day_of_week', v_row.day_of_week,
    'hour', v_row.hour,
    'minute', v_row.minute,
    'timezone', v_row.timezone,
    'active', v_row.active,
    'updated_at', v_row.updated_at
  );
END;
$$;

-- 3. Update RPC — saves schedule and re-programs pg_cron job
CREATE OR REPLACE FUNCTION public.update_weekly_report_schedule(
  _day_of_week SMALLINT,
  _hour SMALLINT,
  _minute SMALLINT,
  _active BOOLEAN DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_cron TEXT;
  v_job_name TEXT := 'weekly-report-email-monday-8am';
  v_command TEXT;
  v_url TEXT := 'https://bbvrhrkifrsgttrqlrds.supabase.co/functions/v1/weekly-report-email';
  v_anon TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJidnJocmtpZnJzZ3R0cnFscmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjA1MjMsImV4cCI6MjA5MjE5NjUyM30.Ydtfo4PFWxk5u14ejdfpjFfYRxaZ8wE4wu7ttUSj4zI';
BEGIN
  IF NOT public.has_any_role(v_user, ARRAY['ceo'::app_role, 'executive'::app_role]) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF _day_of_week IS NULL OR _day_of_week NOT BETWEEN 0 AND 6 THEN
    RETURN jsonb_build_object('error', 'invalid_day_of_week');
  END IF;
  IF _hour IS NULL OR _hour NOT BETWEEN 0 AND 23 THEN
    RETURN jsonb_build_object('error', 'invalid_hour');
  END IF;
  IF _minute IS NULL OR _minute NOT BETWEEN 0 AND 59 THEN
    RETURN jsonb_build_object('error', 'invalid_minute');
  END IF;

  -- Save config
  UPDATE public.report_schedule
     SET day_of_week = _day_of_week,
         hour = _hour,
         minute = _minute,
         active = _active,
         updated_at = now(),
         updated_by = v_user
   WHERE id = 1;

  -- Build cron expression: "minute hour * * day_of_week"
  v_cron := _minute::text || ' ' || _hour::text || ' * * ' || _day_of_week::text;

  v_command := format(
    $cmd$ SELECT net.http_post(
      url := %L,
      headers := %L::jsonb,
      body := jsonb_build_object('time', now(), 'months', 1)
    ) AS request_id; $cmd$,
    v_url,
    '{"Content-Type": "application/json", "Authorization": "Bearer ' || v_anon || '"}'
  );

  -- Re-program the cron job. If it doesn't exist, schedule a new one.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = v_job_name) THEN
    IF _active THEN
      PERFORM cron.alter_job(
        job_id := (SELECT jobid FROM cron.job WHERE jobname = v_job_name),
        schedule := v_cron,
        command := v_command
      );
    ELSE
      PERFORM cron.unschedule(v_job_name);
    END IF;
  ELSE
    IF _active THEN
      PERFORM cron.schedule(v_job_name, v_cron, v_command);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'cron', v_cron,
    'active', _active
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_report_schedule() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_weekly_report_schedule(SMALLINT, SMALLINT, SMALLINT, BOOLEAN) TO authenticated;