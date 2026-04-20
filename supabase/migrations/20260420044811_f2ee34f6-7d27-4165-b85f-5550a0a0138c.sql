-- 1. PROFILES: restrict sensitive fields. Users see own full profile + admins see all.
-- Members see only basic info (name, avatar, job_title, department_id) of others — NOT email/phone/cost.
-- We achieve this via two policies + a security definer view-like helper is NOT needed; we restrict the SELECT itself.

DROP POLICY IF EXISTS "Authenticated can view all profiles" ON public.profiles;

CREATE POLICY "Users view own profile fully"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Managers view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

-- For org chart we need basic info of all teammates. Create a SECURITY DEFINER function
-- that returns only NON-sensitive columns, callable by any authenticated user.
CREATE OR REPLACE FUNCTION public.get_team_directory()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  job_title text,
  department_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, avatar_url, job_title, department_id
  FROM public.profiles;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_directory() TO authenticated;

-- 2. DEALS: restrict to owner/creator/manager+
DROP POLICY IF EXISTS "Authenticated view deals" ON public.deals;

CREATE POLICY "Owner creator or manager view deals"
ON public.deals
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR auth.uid() = created_by
  OR public.has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role])
);

-- 3. DEPARTMENTS budget exposure: restrict full row to managers+; everyone else
-- can still see the department metadata via a function. We split: the table itself becomes manager+.
DROP POLICY IF EXISTS "Authenticated view departments" ON public.departments;

CREATE POLICY "Managers view all department fields"
ON public.departments
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));

-- Public-safe directory of departments (no budget) for all authenticated users
CREATE OR REPLACE FUNCTION public.get_departments_directory()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  color text,
  icon text,
  manager_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, slug, description, color, icon, manager_id
  FROM public.departments;
$$;

GRANT EXECUTE ON FUNCTION public.get_departments_directory() TO authenticated;

-- 4. AI_INSIGHTS: prevent arbitrary generated_for spoofing by members
DROP POLICY IF EXISTS "Members create insights" ON public.ai_insights;

CREATE POLICY "Members create own insights"
ON public.ai_insights
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role])
  OR generated_for = auth.uid()
);

-- 5. updated_at triggers for tables that lack them
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','user_roles','departments','entities','vision','strategy_trees',
    'objectives','key_results','deals','pipeline_stages','benchmarks','ai_insights'
  ])
  LOOP
    -- only attach when column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND column_name='updated_at'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = format('set_updated_at_%s', t)
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
        t, t
      );
    END IF;
  END LOOP;
END $$;