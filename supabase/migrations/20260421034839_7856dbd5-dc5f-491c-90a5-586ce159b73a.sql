-- 1. Bridge ghl_users -> profiles
ALTER TABLE public.ghl_users
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ghl_users_profile_id ON public.ghl_users(profile_id);

-- 2. Extend ghl_leads with internal-only tracking fields
ALTER TABLE public.ghl_leads
  ADD COLUMN IF NOT EXISTS internal_assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS course text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

CREATE INDEX IF NOT EXISTS idx_ghl_leads_internal_assigned_to ON public.ghl_leads(internal_assigned_to);
CREATE INDEX IF NOT EXISTS idx_ghl_leads_university ON public.ghl_leads(university);

-- 3. daily_reports
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  calls_made integer NOT NULL DEFAULT 0,
  leads_contacted integer NOT NULL DEFAULT 0,
  leads_qualified integer NOT NULL DEFAULT 0,
  documents_collected integer NOT NULL DEFAULT 0,
  applications_submitted integer NOT NULL DEFAULT 0,
  students_enrolled integer NOT NULL DEFAULT 0,
  blockers text,
  notes text,
  submitted_at timestamptz,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON public.daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_user ON public.daily_reports(user_id);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own or managers all"
ON public.daily_reports FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role])
);

CREATE POLICY "Users insert own report"
ON public.daily_reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own unlocked or managers"
ON public.daily_reports FOR UPDATE TO authenticated
USING (
  (auth.uid() = user_id AND locked = false)
  OR has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role])
);

CREATE POLICY "Admins delete reports"
ON public.daily_reports FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

CREATE TRIGGER trg_daily_reports_updated_at
BEFORE UPDATE ON public.daily_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. sla_events
CREATE TABLE IF NOT EXISTS public.sla_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_opportunity_id text,
  lead_name text,
  sla_type text NOT NULL,
  from_stage text,
  to_stage text,
  responsible_ghl_user_id text,
  responsible_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  deadline_hours numeric,
  hours_taken numeric,
  deadline_at timestamptz,
  actual_completion_at timestamptz,
  status text NOT NULL DEFAULT 'respected' CHECK (status IN ('respected','breached','pending')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sla_events_opp ON public.sla_events(ghl_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_sla_events_status ON public.sla_events(status);
CREATE INDEX IF NOT EXISTS idx_sla_events_created ON public.sla_events(created_at DESC);

ALTER TABLE public.sla_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view sla"
ON public.sla_events FOR SELECT TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Managers insert sla"
ON public.sla_events FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Managers update sla"
ON public.sla_events FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Admins delete sla"
ON public.sla_events FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

-- 5. agents
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  application_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','approved','active','inactive')),
  commission_pct numeric DEFAULT 10,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent mgr or exec view agents"
ON public.agents FOR SELECT TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'agent_manager'::app_role]));

CREATE POLICY "Agent mgr or exec insert agents"
ON public.agents FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'agent_manager'::app_role]));

CREATE POLICY "Agent mgr or exec update agents"
ON public.agents FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'agent_manager'::app_role]));

CREATE POLICY "Admins delete agents"
ON public.agents FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

CREATE TRIGGER trg_agents_updated_at
BEFORE UPDATE ON public.agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. agent_referrals
CREATE TABLE IF NOT EXISTS public.agent_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  ghl_opportunity_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','qualified','enrolled','rejected')),
  commission_amount numeric DEFAULT 0,
  commission_paid boolean NOT NULL DEFAULT false,
  paid_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_referrals_agent ON public.agent_referrals(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_referrals_status ON public.agent_referrals(status);

ALTER TABLE public.agent_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent mgr or exec view referrals"
ON public.agent_referrals FOR SELECT TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'agent_manager'::app_role]));

CREATE POLICY "Agent mgr or exec insert referrals"
ON public.agent_referrals FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'agent_manager'::app_role]));

CREATE POLICY "Agent mgr or exec update referrals"
ON public.agent_referrals FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'agent_manager'::app_role]));

CREATE POLICY "Admins delete referrals"
ON public.agent_referrals FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

CREATE TRIGGER trg_agent_referrals_updated_at
BEFORE UPDATE ON public.agent_referrals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. SLA trigger on ghl_leads stage change
CREATE OR REPLACE FUNCTION public.log_sla_on_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sla_hours_map jsonb := jsonb_build_object(
    '🆕 Necontactat', 1,
    '📞 Nu Răspunde x1', 24,
    '📞 Nu Răspunde x2', 48,
    '📞 Nu Răspunde x3', 72,
    '💬 În Discuții', 72,
    '📋 Consent Form', 48,
    '📄 Documente Colectate', 48,
    '🎓 Aplicație Trimisă', 168,
    '✅ Acceptat', 48
  );
  v_deadline_hours numeric;
  v_hours_taken numeric;
  v_status text;
BEGIN
  IF TG_OP = 'UPDATE' AND COALESCE(NEW.stage_name,'') <> COALESCE(OLD.stage_name,'') THEN
    v_deadline_hours := (sla_hours_map->>OLD.stage_name)::numeric;
    IF v_deadline_hours IS NOT NULL THEN
      v_hours_taken := EXTRACT(EPOCH FROM (now() - COALESCE(OLD.ghl_updated_at, OLD.updated_at))) / 3600.0;
      v_status := CASE WHEN v_hours_taken <= v_deadline_hours THEN 'respected' ELSE 'breached' END;

      INSERT INTO public.sla_events (
        ghl_opportunity_id, lead_name, sla_type, from_stage, to_stage,
        responsible_ghl_user_id, deadline_hours, hours_taken,
        deadline_at, actual_completion_at, status
      ) VALUES (
        NEW.ghl_opportunity_id,
        NEW.full_name,
        OLD.stage_name || ' → ' || NEW.stage_name,
        OLD.stage_name,
        NEW.stage_name,
        NEW.assigned_to,
        v_deadline_hours,
        round(v_hours_taken::numeric, 2),
        COALESCE(OLD.ghl_updated_at, OLD.updated_at) + (v_deadline_hours || ' hours')::interval,
        now(),
        v_status
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_sla_on_stage_change ON public.ghl_leads;
CREATE TRIGGER trg_log_sla_on_stage_change
AFTER UPDATE ON public.ghl_leads
FOR EACH ROW EXECUTE FUNCTION public.log_sla_on_stage_change();