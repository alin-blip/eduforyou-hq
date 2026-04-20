-- Tighten project_sync_log SELECT: only managers+ can see internal error messages and timings
DROP POLICY IF EXISTS "Authenticated view sync log" ON public.project_sync_log;

CREATE POLICY "Managers view sync log"
ON public.project_sync_log
FOR SELECT
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role]));