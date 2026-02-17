-- Script para deletar a pauta "teste de descri"
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos encontrar a pauta exata
SELECT 
  id,
  titulo,
  descricao,
  data_inicio,
  criado_por,
  created_at
FROM pautas_events
WHERE LOWER(titulo) LIKE '%teste%descri%'
   OR LOWER(descricao) LIKE '%teste%descri%';

-- 2. Se houver registros relacionados em pautas_audit_log, precisamos deletá-los primeiro
DELETE FROM pautas_audit_log
WHERE event_id IN (
  SELECT id 
  FROM pautas_events 
  WHERE LOWER(titulo) LIKE '%teste%descri%'
     OR LOWER(descricao) LIKE '%teste%descri%'
);


-- 3. Agora deletar a pauta principal
-- IMPORTANTE: Este comando ignora as políticas RLS usando um usuário admin
DELETE FROM pautas_events
WHERE LOWER(titulo) LIKE '%teste%descri%'
   OR LOWER(descricao) LIKE '%teste%descri%';

-- 4. Verificar se foi deletado
SELECT 
  id,
  titulo,
  descricao
FROM pautas_events
WHERE LOWER(titulo) LIKE '%teste%descri%'
   OR LOWER(descricao) LIKE '%teste%descri%';

-- Se ainda não funcionar, pode ser necessário desabilitar temporariamente as RLS:
-- ALTER TABLE pautas_events DISABLE ROW LEVEL SECURITY;
-- DELETE FROM pautas_events WHERE LOWER(titulo) LIKE '%teste%descri%';
-- ALTER TABLE pautas_events ENABLE ROW LEVEL SECURITY;
