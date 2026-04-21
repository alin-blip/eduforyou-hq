-- Table for GoHighLevel leads sync
CREATE TABLE public.ghl_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghl_contact_id TEXT UNIQUE NOT NULL,
  ghl_opportunity_id TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  pipeline_id TEXT,
  pipeline_name TEXT,
  stage_id TEXT,
  stage_name TEXT,
  status TEXT,
  monetary_value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  tags TEXT[] DEFAULT '{}',
  assigned_to TEXT,
  ghl_created_at TIMESTAMPTZ,
  ghl_updated_at TIMESTAMPTZ,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ghl_leads_email ON public.ghl_leads(email);
CREATE INDEX idx_ghl_leads_status ON public.ghl_leads(status);
CREATE INDEX idx_ghl_leads_stage ON public.ghl_leads(stage_id);
CREATE INDEX idx_ghl_leads_synced_at ON public.ghl_leads(synced_at DESC);

ALTER TABLE public.ghl_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view ghl leads"
ON public.ghl_leads FOR SELECT TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Managers insert ghl leads"
ON public.ghl_leads FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Managers update ghl leads"
ON public.ghl_leads FOR UPDATE TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Admins delete ghl leads"
ON public.ghl_leads FOR DELETE TO authenticated
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_ghl_leads_updated_at
BEFORE UPDATE ON public.ghl_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sync log table (lightweight)
CREATE TABLE public.ghl_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by UUID,
  contacts_synced INTEGER DEFAULT 0,
  opportunities_synced INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ghl_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view ghl sync log"
ON public.ghl_sync_log FOR SELECT TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

CREATE POLICY "Managers insert ghl sync log"
ON public.ghl_sync_log FOR INSERT TO authenticated
WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));