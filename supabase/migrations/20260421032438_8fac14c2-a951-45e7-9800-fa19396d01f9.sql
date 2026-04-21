-- Switch unique constraint from contact to opportunity
ALTER TABLE public.ghl_leads DROP CONSTRAINT IF EXISTS ghl_leads_ghl_contact_id_key;

-- Some legacy rows may have null opportunity_id; assign synthetic value to allow unique constraint
UPDATE public.ghl_leads
SET ghl_opportunity_id = 'contact:' || ghl_contact_id
WHERE ghl_opportunity_id IS NULL;

ALTER TABLE public.ghl_leads ALTER COLUMN ghl_opportunity_id SET NOT NULL;
ALTER TABLE public.ghl_leads ADD CONSTRAINT ghl_leads_opportunity_unique UNIQUE (ghl_opportunity_id);

CREATE INDEX IF NOT EXISTS idx_ghl_leads_stage ON public.ghl_leads(stage_name);
CREATE INDEX IF NOT EXISTS idx_ghl_leads_pipeline ON public.ghl_leads(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_ghl_leads_status ON public.ghl_leads(status);

-- Pipelines cache table
CREATE TABLE IF NOT EXISTS public.ghl_pipelines (
  id text PRIMARY KEY,
  name text NOT NULL,
  is_master boolean NOT NULL DEFAULT false,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_opportunities integer NOT NULL DEFAULT 0,
  synced_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ghl_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view pipelines"
  ON public.ghl_pipelines FOR SELECT
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Managers upsert pipelines"
  ON public.ghl_pipelines FOR INSERT
  TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Managers update pipelines"
  ON public.ghl_pipelines FOR UPDATE
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Admins delete pipelines"
  ON public.ghl_pipelines FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));