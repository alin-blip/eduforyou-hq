
-- Notifications table
CREATE TYPE public.notification_kind AS ENUM ('task', 'meeting', 'okr', 'sync', 'invite', 'system');
CREATE TYPE public.notification_severity AS ENUM ('info', 'success', 'warning', 'critical');

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind public.notification_kind NOT NULL DEFAULT 'system',
  severity public.notification_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications" ON public.notifications
FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Authenticated insert notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ========== TRIGGER: task assigned ==========
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title TEXT;
BEGIN
  IF NEW.assignee_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.assignee_id IS NOT DISTINCT FROM NEW.assignee_id THEN
    RETURN NEW;
  END IF;
  IF NEW.assignee_id = COALESCE(NEW.reporter_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    RETURN NEW;
  END IF;
  v_title := 'Ai un task nou: ' || NEW.title;
  INSERT INTO public.notifications (user_id, kind, severity, title, message, link, entity_type, entity_id)
  VALUES (NEW.assignee_id, 'task', 'info', v_title,
    COALESCE('Prioritate: ' || NEW.priority::text, NULL),
    '/tasks?id=' || NEW.id::text, 'task', NEW.id);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_task_assigned
AFTER INSERT OR UPDATE OF assignee_id ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_task_assigned();

-- ========== TRIGGER: meeting created → notify participants ==========
CREATE OR REPLACE FUNCTION public.notify_meeting_participant()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meeting RECORD;
BEGIN
  SELECT title, scheduled_at INTO v_meeting FROM public.meetings WHERE id = NEW.meeting_id;
  IF v_meeting IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, kind, severity, title, message, link, entity_type, entity_id)
  VALUES (NEW.user_id, 'meeting', 'info',
    'Ai fost invitat: ' || v_meeting.title,
    'Programat: ' || to_char(v_meeting.scheduled_at, 'DD Mon HH24:MI'),
    '/cicles?meeting=' || NEW.meeting_id::text, 'meeting', NEW.meeting_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_meeting_participant
AFTER INSERT ON public.meeting_participants
FOR EACH ROW EXECUTE FUNCTION public.notify_meeting_participant();

-- ========== TRIGGER: objective off_track / at_risk ==========
CREATE OR REPLACE FUNCTION public.notify_objective_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_target UUID;
  v_severity public.notification_severity;
BEGIN
  IF NEW.status NOT IN ('off_track', 'at_risk') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  v_target := COALESCE(NEW.owner_id, NEW.created_by);
  IF v_target IS NULL THEN RETURN NEW; END IF;
  v_severity := CASE WHEN NEW.status = 'off_track' THEN 'critical'::public.notification_severity
                     ELSE 'warning'::public.notification_severity END;
  INSERT INTO public.notifications (user_id, kind, severity, title, message, link, entity_type, entity_id)
  VALUES (v_target, 'okr', v_severity,
    'OKR ' || CASE WHEN NEW.status = 'off_track' THEN 'off track' ELSE 'la risc' END || ': ' || NEW.title,
    'Progres curent: ' || NEW.progress::text || '%',
    '/okr?id=' || NEW.id::text, 'objective', NEW.id);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_objective_status
AFTER INSERT OR UPDATE OF status ON public.objectives
FOR EACH ROW EXECUTE FUNCTION public.notify_objective_status();

-- ========== TRIGGER: sync failed → notify all managers ==========
CREATE OR REPLACE FUNCTION public.notify_sync_failed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID;
BEGIN
  IF NEW.success THEN RETURN NEW; END IF;
  FOR v_user IN
    SELECT DISTINCT user_id FROM public.user_roles
    WHERE role IN ('ceo','executive','manager')
  LOOP
    INSERT INTO public.notifications (user_id, kind, severity, title, message, link, entity_type, entity_id)
    VALUES (v_user, 'sync', 'critical',
      'Sync proiecte a eșuat',
      COALESCE(NEW.error_message, 'Eroare necunoscută') || ' (sursa: ' || NEW.source || ')',
      '/projects', 'sync_log', NEW.id);
  END LOOP;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_sync_failed
AFTER INSERT ON public.project_sync_log
FOR EACH ROW EXECUTE FUNCTION public.notify_sync_failed();
