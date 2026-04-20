DROP POLICY IF EXISTS "Authenticated view insights" ON public.ai_insights;

CREATE POLICY "Targeted user or manager view insights"
ON public.ai_insights
FOR SELECT
TO authenticated
USING (
  generated_for = auth.uid()
  OR generated_for IS NULL
  OR public.has_any_role(auth.uid(), ARRAY['ceo'::app_role, 'executive'::app_role, 'manager'::app_role])
);