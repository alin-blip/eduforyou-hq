
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.tree_type AS ENUM ('value','profit','kpi');
CREATE TYPE public.deal_status AS ENUM ('open','won','lost');
CREATE TYPE public.insight_type AS ENUM ('cfo','copilot','alert','recommendation');

-- =========================
-- ENTITIES (multi-entity / holding)
-- =========================
CREATE TABLE public.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view entities" ON public.entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert entities" ON public.entities FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update entities" ON public.entities FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete entities" ON public.entities FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_entities_updated BEFORE UPDATE ON public.entities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- VISION
-- =========================
CREATE TABLE public.vision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  story text,
  mission text,
  brand_promise text,
  bhag text,
  core_values jsonb DEFAULT '[]'::jsonb,
  milestones jsonb DEFAULT '[]'::jsonb,
  target_year integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vision ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view vision" ON public.vision FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create vision" ON public.vision FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]));
CREATE POLICY "Managers update vision" ON public.vision FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]));
CREATE POLICY "Admins delete vision" ON public.vision FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_vision_updated BEFORE UPDATE ON public.vision
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- STRATEGY TREES
-- =========================
CREATE TABLE public.strategy_trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  type public.tree_type NOT NULL,
  name text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{"nodes":[]}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.strategy_trees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view trees" ON public.strategy_trees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create trees" ON public.strategy_trees FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]));
CREATE POLICY "Managers update trees" ON public.strategy_trees FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]));
CREATE POLICY "Admins delete trees" ON public.strategy_trees FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_trees_updated BEFORE UPDATE ON public.strategy_trees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- SALES PIPELINE
-- =========================
CREATE TABLE public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  probability integer NOT NULL DEFAULT 0,
  color text DEFAULT 'primary',
  is_won boolean NOT NULL DEFAULT false,
  is_lost boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view stages" ON public.pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers manage stages" ON public.pipeline_stages FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]));

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  title text NOT NULL,
  company_name text,
  contact_name text,
  contact_email text,
  value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  stage_id uuid REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
  status public.deal_status NOT NULL DEFAULT 'open',
  source text,
  owner_id uuid,
  expected_close date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view deals" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create deals" ON public.deals FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]));
CREATE POLICY "Owner or admin updates deal" ON public.deals FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = created_by OR public.is_admin(auth.uid()));
CREATE POLICY "Admin or creator deletes deal" ON public.deals FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- BENCHMARKS
-- =========================
CREATE TABLE public.benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric text NOT NULL,
  industry text NOT NULL DEFAULT 'EdTech',
  value numeric NOT NULL,
  unit text,
  source text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view benchmarks" ON public.benchmarks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers manage benchmarks" ON public.benchmarks FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]));

CREATE TRIGGER trg_benchmarks_updated BEFORE UPDATE ON public.benchmarks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- AI INSIGHTS
-- =========================
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  type public.insight_type NOT NULL DEFAULT 'cfo',
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'info',
  generated_for uuid,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view insights" ON public.ai_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated create insights" ON public.ai_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins delete insights" ON public.ai_insights FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- =========================
-- SEED DATA
-- =========================
INSERT INTO public.entities (name, slug, description, is_default)
VALUES ('EduForYou', 'eduforyou', 'Compania principală — academy, Agent Hub, Partners SAAS', true);

INSERT INTO public.pipeline_stages (entity_id, name, position, probability, color, is_won, is_lost)
SELECT id, s.name, s.pos, s.prob, s.color, s.won, s.lost
FROM public.entities, (VALUES
  ('Lead', 1, 10, 'muted', false, false),
  ('Qualified', 2, 30, 'primary', false, false),
  ('Proposal', 3, 60, 'warning', false, false),
  ('Won', 4, 100, 'success', true, false),
  ('Lost', 5, 0, 'destructive', false, true)
) AS s(name, pos, prob, color, won, lost)
WHERE slug = 'eduforyou';

INSERT INTO public.benchmarks (metric, industry, value, unit, source) VALUES
('CAC', 'EdTech', 120, 'EUR', 'Industry average 2024'),
('LTV', 'EdTech', 850, 'EUR', 'Industry average 2024'),
('LTV/CAC ratio', 'EdTech', 3.5, 'x', 'Healthy benchmark'),
('Monthly churn', 'EdTech SaaS', 5, '%', 'Industry average'),
('Gross margin', 'EdTech', 70, '%', 'Industry average'),
('Conversion rate (visitor → lead)', 'EdTech', 3, '%', 'Industry average'),
('Conversion rate (lead → customer)', 'EdTech', 15, '%', 'Industry average');
