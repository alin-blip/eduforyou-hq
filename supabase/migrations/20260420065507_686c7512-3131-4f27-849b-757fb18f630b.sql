CREATE OR REPLACE FUNCTION public.notify_upcoming_meetings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ := now() + INTERVAL '13 minutes';
  v_window_end   TIMESTAMPTZ := now() + INTERVAL '18 minutes';
  v_created INTEGER := 0;
  r RECORD;
  v_link TEXT;
  v_minutes INTEGER;
BEGIN
  FOR r IN
    SELECT m.id AS meeting_id, m.title, m.scheduled_at, mp.user_id
    FROM public.meetings m
    JOIN public.meeting_participants mp ON mp.meeting_id = m.id
    WHERE m.status = 'scheduled'
      AND m.scheduled_at >= v_window_start
      AND m.scheduled_at <  v_window_end
      AND mp.status IN ('invited', 'confirmed')
  LOOP
    v_link := '/cicles?meeting=' || r.meeting_id::text;
    v_minutes := GREATEST(0, EXTRACT(EPOCH FROM (r.scheduled_at - now()))/60)::int;

    -- Skip if a similar reminder was already created in the last 30 minutes
    IF EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = r.user_id
        AND kind = 'meeting'
        AND link = v_link
        AND title LIKE 'Meeting în %'
        AND created_at > now() - INTERVAL '30 minutes'
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.notifications (user_id, kind, severity, title, message, link, entity_type, entity_id)
    VALUES (
      r.user_id, 'meeting', 'warning',
      'Meeting în ' || v_minutes || ' minute: ' || r.title,
      'Începe la ' || to_char(r.scheduled_at, 'HH24:MI'),
      v_link, 'meeting', r.meeting_id
    );
    v_created := v_created + 1;
  END LOOP;

  RETURN jsonb_build_object('created', v_created, 'at', now());
END;
$$;