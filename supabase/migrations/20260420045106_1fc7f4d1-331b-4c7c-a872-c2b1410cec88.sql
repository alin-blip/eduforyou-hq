-- Enums
CREATE TYPE public.task_status AS ENUM ('todo','in_progress','blocked','done');
CREATE TYPE public.task_priority AS ENUM ('low','medium','high','urgent');

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  assignee_id uuid,
  reporter_id uuid,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  key_result_id uuid REFERENCES public.key_results(id) ON DELETE SET NULL,
  objective_id uuid REFERENCES public.objectives(id) ON DELETE SET NULL,
  entity_id uuid REFERENCES public.entities(id) ON DELETE SET NULL,
  start_date date,
  due_date date,
  estimated_hours numeric,
  logged_hours numeric DEFAULT 0,
  tags text[] DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_kr ON public.tasks(key_result_id);
CREATE INDEX idx_tasks_dept ON public.tasks(department_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due ON public.tasks(due_date);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view tasks"
  ON public.tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers create tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ceo'::app_role,'executive'::app_role,'manager'::app_role]));

CREATE POLICY "Assignee reporter or manager update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    auth.uid() = assignee_id
    OR auth.uid() = reporter_id
    OR public.has_any_role(auth.uid(), ARRAY['ceo'::app_role,'executive'::app_role,'manager'::app_role])
  );

CREATE POLICY "Reporter or manager delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    auth.uid() = reporter_id
    OR public.has_any_role(auth.uid(), ARRAY['ceo'::app_role,'executive'::app_role,'manager'::app_role])
  );

CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-set completed_at when status flips to done
CREATE OR REPLACE FUNCTION public.tasks_set_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    NEW.completed_at := now();
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_completed_at_trg
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tasks_set_completed_at();