-- SCRIPT DE DIAGNÓSTICO COMPLETO
-- Execute linha por linha no SQL Editor do Supabase para entender o problema

-- ===========================================
-- 1. ENCONTRAR A PAUTA PROBLEMÁTICA
-- ===========================================
SELECT 
  id,
  titulo,
  descricao,
  data_inicio,
  criado_por,
  created_at,
  updated_at
FROM pautas_events
WHERE LOWER(titulo) LIKE '%teste%'
ORDER BY created_at DESC;

-- ===========================================
-- 2. VERIFICAR POLÍTICAS RLS DA TABELA
-- ===========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'pautas_events';

-- ===========================================
-- 3. VERIFICAR TODAS AS FOREIGN KEYS QUE REFERENCIAM pautas_events
-- ===========================================
SELECT
  tc.table_schema, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'pautas_events';

-- ===========================================
-- 4. VERIFICAR TRIGGERS NA TABELA
-- ===========================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'pautas_events';

-- ===========================================
-- 5. VERIFICAR SE HÁ LOGS DE AUDITORIA PARA ESTA PAUTA
-- ===========================================
SELECT 
  pal.id,
  pal.event_id,
  pal.user_id,
  pal.action,
  pal.created_at,
  pe.titulo
FROM pautas_audit_log pal
LEFT JOIN pautas_events pe ON pal.event_id = pe.id
WHERE pe.titulo LIKE '%teste%'
   OR pal.event_id IN (
     SELECT id FROM pautas_events WHERE LOWER(titulo) LIKE '%teste%'
   );

-- ===========================================
-- 6. VERIFICAR CONSTRAINT ATUAL DA AUDIT_LOG
-- ===========================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'pautas_audit_log'
  AND kcu.column_name = 'event_id';

-- ===========================================
-- 7. VERIFICAR PERMISSÕES DO USUÁRIO ATUAL
-- ===========================================
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'role' as user_role;

-- ===========================================
-- 8. TESTAR PERMISSÃO DE DELETE (não executa, só testa)
-- ===========================================
-- Este é um teste - descomente e substitua o ID para testar
-- EXPLAIN DELETE FROM pautas_events WHERE id = 'SEU-ID-AQUI';
