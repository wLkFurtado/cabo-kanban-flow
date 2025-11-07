-- Adjust RLS for pautas_events to avoid recursion with pautas_participants
-- Replace participant check to reference event_participants via source_event_id

BEGIN;

DROP POLICY IF EXISTS "Users can view pautas events they created or participate in" ON public.pautas_events;

CREATE POLICY "Users can view pautas events they created or participate in" ON public.pautas_events
  FOR SELECT USING (
    criado_por = auth.uid() OR
    responsavel_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.event_participants ep
      WHERE ep.event_id = pautas_events.source_event_id AND ep.user_id = auth.uid()
    )
  );

COMMIT;