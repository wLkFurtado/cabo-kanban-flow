-- SOLUÇÃO RÁPIDA: Execute este script no SQL Editor do Supabase
-- Isso corrige o problema da foreign key que impede deleção de pautas

-- Passo 1: Recriar a constraint para permitir CASCADE
ALTER TABLE public.pautas_audit_log
  DROP CONSTRAINT IF EXISTS pautas_audit_log_event_id_fkey;

ALTER TABLE public.pautas_audit_log
  ADD CONSTRAINT pautas_audit_log_event_id_fkey
  FOREIGN KEY (event_id) 
  REFERENCES public.pautas_events(id) 
  ON DELETE CASCADE;

-- Passo 2: Agora você pode deletar a pauta problemática
DELETE FROM pautas_events
WHERE LOWER(titulo) LIKE '%teste%descri%'
   OR LOWER(descricao) LIKE '%teste%descri%';

-- Passo 3: Verificar se foi deletada
SELECT 
  id,
  titulo,
  descricao
FROM pautas_events
WHERE LOWER(titulo) LIKE '%teste%descri%';
-- Deve retornar 0 resultados

-- EXPLICAÇÃO:
-- O problema era que a constraint estava configurada como ON DELETE SET NULL,
-- mas a trigger AFTER DELETE tentava inserir o log antes da constraint ser aplicada.
-- Com ON DELETE CASCADE, quando você deleta uma pauta, os logs são automaticamente
-- deletados em cascata, evitando o conflito.
