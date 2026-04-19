
DROP POLICY IF EXISTS "Authenticated create insights" ON public.ai_insights;

CREATE POLICY "Members create insights" ON public.ai_insights
FOR INSERT TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['ceo','executive','manager','member']::app_role[]));
