-- Corrigir sistema de auditoria para permitir deleção de pautas
-- O problema é que a trigger tenta inserir event_id antes da deleção completar

BEGIN;

-- Solução 1: Modificar a constraint para permitir deleção em cascata dos logs
-- Isso deletará os logs quando a pauta for deletada
ALTER TABLE public.pautas_audit_log
  DROP CONSTRAINT IF EXISTS pautas_audit_log_event_id_fkey;

ALTER TABLE public.pautas_audit_log
  ADD CONSTRAINT pautas_audit_log_event_id_fkey
  FOREIGN KEY (event_id) 
  REFERENCES public.pautas_events(id) 
  ON DELETE CASCADE;

-- Solução alternativa (comentada): 
-- Se preferir manter os logs mesmo após deleção, podemos:
-- 1. Fazer event_id nullable e usar ON DELETE SET NULL
-- 2. Modificar a trigger para usar BEFORE DELETE ao invés de AFTER DELETE

-- Para usar a solução alternativa, descomente abaixo e comente o bloco acima:
/*
-- Permitir que event_id seja NULL
ALTER TABLE public.pautas_audit_log 
  ALTER COLUMN event_id DROP NOT NULL;

-- Recriar constraint com SET NULL
ALTER TABLE public.pautas_audit_log
  DROP CONSTRAINT IF EXISTS pautas_audit_log_event_id_fkey;

ALTER TABLE public.pautas_audit_log
  ADD CONSTRAINT pautas_audit_log_event_id_fkey
  FOREIGN KEY (event_id) 
  REFERENCES public.pautas_events(id) 
  ON DELETE SET NULL;

-- Modificar a trigger para BEFORE DELETE
DROP TRIGGER IF EXISTS pautas_audit_trigger ON public.pautas_events;
CREATE TRIGGER pautas_audit_trigger
  BEFORE DELETE OR AFTER INSERT OR AFTER UPDATE ON public.pautas_events
  FOR EACH ROW EXECUTE FUNCTION public.log_pauta_audit();
*/

COMMIT;
