
-- =========================================================
-- EduForYou OS — Val 2 schema
-- =========================================================

CREATE TYPE public.app_role AS ENUM ('ceo', 'executive', 'manager', 'member');
CREATE TYPE public.objective_level AS ENUM ('company', 'department', 'individual');
CREATE TYPE public.objective_status AS ENUM ('on_track', 'at_risk', 'off_track', 'completed', 'archived');
CREATE TYPE public.kr_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT 'primary',
  icon TEXT DEFAULT 'Building2',
  manager_id UUID,
  budget_monthly NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  job_title TEXT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  phone TEXT,
  monthly_cost NUMERIC(10,2),
  weekly_capacity_hours INTEGER DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.departments
  ADD CONSTRAINT departments_manager_id_fkey
  FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('ceo','executive'));
$$;

CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  level public.objective_level NOT NULL DEFAULT 'company',
  status public.objective_status NOT NULL DEFAULT 'on_track',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.objectives(id) ON DELETE SET NULL,
  quarter TEXT NOT NULL,
  start_date DATE,
  due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_objectives_quarter ON public.objectives(quarter);
CREATE INDEX idx_objectives_dept ON public.objectives(department_id);
CREATE INDEX idx_objectives_owner ON public.objectives(owner_id);
CREATE TRIGGER trg_objectives_updated_at BEFORE UPDATE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric_unit TEXT,
  start_value NUMERIC(14,2) DEFAULT 0,
  target_value NUMERIC(14,2) NOT NULL,
  current_value NUMERIC(14,2) DEFAULT 0,
  status public.kr_status NOT NULL DEFAULT 'not_started',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kr_objective ON public.key_results(objective_id);
CREATE TRIGGER trg_key_results_updated_at BEFORE UPDATE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INTEGER;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)));

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN assigned_role := 'ceo';
  ELSE assigned_role := 'member'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated view departments" ON public.departments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert departments" ON public.departments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins update departments" ON public.departments
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete departments" ON public.departments
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated view objectives" ON public.objectives
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create objectives" ON public.objectives
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::public.app_role[]));
CREATE POLICY "Owner or admin updates objective" ON public.objectives
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = created_by OR public.is_admin(auth.uid()));
CREATE POLICY "Admin or creator deletes objective" ON public.objectives
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.is_admin(auth.uid()));

CREATE POLICY "Authenticated view key results" ON public.key_results
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create key results" ON public.key_results
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::public.app_role[]));
CREATE POLICY "Owner or admin updates KR" ON public.key_results
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id OR public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.objectives o WHERE o.id = key_results.objective_id
      AND (o.owner_id = auth.uid() OR o.created_by = auth.uid()))
  );
CREATE POLICY "Admin or objective creator deletes KR" ON public.key_results
  FOR DELETE TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.objectives o WHERE o.id = key_results.objective_id
      AND o.created_by = auth.uid())
  );

INSERT INTO public.departments (name, slug, description, icon) VALUES
  ('Marketing', 'marketing', 'Brand, content, performance ads', 'Megaphone'),
  ('Sales', 'sales', 'B2C și B2B sales pipeline', 'Handshake'),
  ('Operations', 'operations', 'Operațiuni, suport, livrare', 'Settings'),
  ('Product', 'product', 'Produs, design, dezvoltare', 'Package'),
  ('Agent Hub', 'agent-hub', 'Rețeaua de agenți recrutare', 'UserPlus'),
  ('Partners SAAS', 'partners-saas', 'AgencyOS pentru parteneri B2B', 'Network'),
  ('Finance', 'finance', 'Contabilitate, CFO, bugete', 'Wallet');
