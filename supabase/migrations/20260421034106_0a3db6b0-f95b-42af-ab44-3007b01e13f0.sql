-- 1) Notes columns on ghl_leads
ALTER TABLE public.ghl_leads
  ADD COLUMN IF NOT EXISTS notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_note_body text,
  ADD COLUMN IF NOT EXISTS last_note_at timestamptz;

-- 2) ghl_users mapping table
CREATE TABLE IF NOT EXISTS public.ghl_users (
  ghl_user_id text PRIMARY KEY,
  display_name text NOT NULL,
  language text NOT NULL DEFAULT 'other' CHECK (language IN ('ro','en','other')),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ghl_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view ghl users"
  ON public.ghl_users FOR SELECT
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role,'executive'::app_role,'manager'::app_role]));

CREATE POLICY "Managers insert ghl users"
  ON public.ghl_users FOR INSERT
  TO authenticated
  WITH CHECK (has_any_role(auth.uid(), ARRAY['ceo'::app_role,'executive'::app_role,'manager'::app_role]));

CREATE POLICY "Managers update ghl users"
  ON public.ghl_users FOR UPDATE
  TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role,'executive'::app_role,'manager'::app_role]));

CREATE POLICY "Admins delete ghl users"
  ON public.ghl_users FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE TRIGGER update_ghl_users_updated_at
  BEFORE UPDATE ON public.ghl_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Seed known users
INSERT INTO public.ghl_users (ghl_user_id, display_name, language, is_active) VALUES
  ('dA3aj2FKfVcDfkN1025N', 'Cristian', 'ro', true),
  ('m1zfsJ02lY1y5PpbKiiE', 'EN Consultant 1', 'en', true),
  ('bPhmWA2a0Oo5cVr3i8sC', 'EN Consultant 2', 'en', true)
ON CONFLICT (ghl_user_id) DO NOTHING;