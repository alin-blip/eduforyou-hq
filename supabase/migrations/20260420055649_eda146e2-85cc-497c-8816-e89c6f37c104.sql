-- Project Hub: projects table + metrics + RLS
CREATE TYPE public.project_status AS ENUM ('draft', 'live', 'paused', 'archived');

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status public.project_status NOT NULL DEFAULT 'draft',
  category TEXT,
  public_url TEXT,
  edit_url TEXT,
  icon TEXT DEFAULT 'FolderKanban',
  color TEXT DEFAULT 'primary',
  owner_id UUID,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.project_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  label TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  delta_pct NUMERIC,
  trend TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, metric_key)
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view projects" ON public.projects
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers create projects" ON public.projects
FOR INSERT TO authenticated WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Owner or manager update projects" ON public.projects
FOR UPDATE TO authenticated USING (
  auth.uid() = owner_id OR auth.uid() = created_by OR has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role])
);

CREATE POLICY "Admin or creator delete projects" ON public.projects
FOR DELETE TO authenticated USING (auth.uid() = created_by OR is_admin(auth.uid()));

CREATE POLICY "Authenticated view project metrics" ON public.project_metrics
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers manage project metrics" ON public.project_metrics
FOR ALL TO authenticated 
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]))
WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER project_metrics_updated_at BEFORE UPDATE ON public.project_metrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_project_metrics_project ON public.project_metrics(project_id);

-- Seed default projects
INSERT INTO public.projects (name, slug, description, status, category, public_url, icon, color, position) VALUES
('EduForYou Main', 'eduforyou-main', 'Platforma principală EduForYou - cursuri B2C', 'live', 'platform', 'https://eduforyou.ro', 'GraduationCap', 'primary', 0),
('Agent Hub', 'agent-hub', 'Hub pentru agenți de vânzări - lead gen + conversie', 'live', 'saas', NULL, 'Users', 'accent', 1),
('Partners SAAS', 'partners-saas', 'Platformă SaaS pentru parteneri și revânzători', 'live', 'saas', NULL, 'Handshake', 'success', 2),
('Webinar Platform', 'webinar', 'Sistem webinar live + replay automation', 'live', 'platform', NULL, 'Video', 'primary', 3),
('Hub-uri Specializate', 'hubs', 'Mini-platforme verticale per nișă', 'draft', 'platform', NULL, 'Layers', 'muted', 4);
