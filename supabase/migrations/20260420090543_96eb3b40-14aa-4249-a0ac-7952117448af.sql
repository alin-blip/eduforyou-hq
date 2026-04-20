-- RPC SECURITY DEFINER care returnează status-ul auth pentru fiecare user din profiles.
-- Accesibil doar managerilor/executivilor/CEO.
CREATE OR REPLACE FUNCTION public.get_team_auth_status()
RETURNS TABLE (
  user_id uuid,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  invited_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email_confirmed_at,
    u.last_sign_in_at,
    u.invited_at
  FROM auth.users u
  INNER JOIN public.profiles p ON p.id = u.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_auth_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_auth_status() TO authenticated;