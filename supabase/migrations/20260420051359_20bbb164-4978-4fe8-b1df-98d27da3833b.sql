
-- Enums
CREATE TYPE public.meeting_cadence AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');
CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.meeting_item_kind AS ENUM ('agenda', 'decision', 'action', 'blocker', 'note');
CREATE TYPE public.meeting_item_status AS ENUM ('open', 'in_progress', 'done', 'cancelled');
CREATE TYPE public.participant_status AS ENUM ('invited', 'confirmed', 'attended', 'missed');

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  cadence public.meeting_cadence NOT NULL DEFAULT 'weekly',
  status public.meeting_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  facilitator_id UUID,
  agenda TEXT,
  notes TEXT,
  decisions TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at DESC);
CREATE INDEX idx_meetings_cadence ON public.meetings(cadence);

-- Participants
CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status public.participant_status NOT NULL DEFAULT 'invited',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

CREATE INDEX idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user ON public.meeting_participants(user_id);

-- Items (agenda + action items + decisions)
CREATE TABLE public.meeting_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  kind public.meeting_item_kind NOT NULL DEFAULT 'agenda',
  title TEXT NOT NULL,
  description TEXT,
  status public.meeting_item_status NOT NULL DEFAULT 'open',
  owner_id UUID,
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  objective_id UUID REFERENCES public.objectives(id) ON DELETE SET NULL,
  key_result_id UUID REFERENCES public.key_results(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meeting_items_meeting ON public.meeting_items(meeting_id);
CREATE INDEX idx_meeting_items_owner ON public.meeting_items(owner_id);
CREATE INDEX idx_meeting_items_status ON public.meeting_items(status);

-- Triggers updated_at
CREATE TRIGGER trg_meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_meeting_items_updated_at BEFORE UPDATE ON public.meeting_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto completed_at on item done
CREATE OR REPLACE FUNCTION public.meeting_items_set_completed_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    NEW.completed_at := now();
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_meeting_items_completed_at BEFORE UPDATE ON public.meeting_items
  FOR EACH ROW EXECUTE FUNCTION public.meeting_items_set_completed_at();

-- RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_items ENABLE ROW LEVEL SECURITY;

-- meetings policies
CREATE POLICY "Authenticated view meetings" ON public.meetings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create meetings" ON public.meetings
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers update meetings" ON public.meetings
  FOR UPDATE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]) OR auth.uid() = created_by OR auth.uid() = facilitator_id);
CREATE POLICY "Admin or creator delete meetings" ON public.meetings
  FOR DELETE TO authenticated
  USING (is_admin(auth.uid()) OR auth.uid() = created_by);

-- participants policies
CREATE POLICY "Authenticated view participants" ON public.meeting_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers manage participants" ON public.meeting_participants
  FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Users update own participation" ON public.meeting_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- items policies
CREATE POLICY "Authenticated view meeting items" ON public.meeting_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create meeting items" ON public.meeting_items
  FOR INSERT TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Owner or manager update items" ON public.meeting_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
CREATE POLICY "Managers delete meeting items" ON public.meeting_items
  FOR DELETE TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));
