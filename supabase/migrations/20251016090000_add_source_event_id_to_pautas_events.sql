BEGIN;

-- Adiciona coluna para vincular pauta ao evento da Agenda
ALTER TABLE public.pautas_events
ADD COLUMN IF NOT EXISTS source_event_id uuid;

-- FK para manter integridade referenciando events.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pautas_events_source_event_id_fkey'
  ) THEN
    ALTER TABLE public.pautas_events
    ADD CONSTRAINT pautas_events_source_event_id_fkey
    FOREIGN KEY (source_event_id)
    REFERENCES public.events (id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Índice para pesquisas rápidas por vínculo
CREATE INDEX IF NOT EXISTS idx_pautas_events_source_event_id
  ON public.pautas_events (source_event_id);

COMMIT;