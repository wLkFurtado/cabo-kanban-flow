-- SOLUÇÃO DEFINITIVA: Deletar a pauta "teste" com BYPASS de RLS
-- Execute este script no SQL Editor do Supabase (você precisa estar logado como admin/service role)

-- ===========================================
-- OPÇÃO 1: DELETAR COM BYPASS TEMPORÁRIO DE RLS
-- ===========================================
-- Esta é a forma mais direta - desabilita RLS temporariamente

BEGIN;

-- Desabilitar RLS temporariamente
ALTER TABLE pautas_events DISABLE ROW LEVEL SECURITY;

-- Deletar a pauta (e CASCADE vai deletar os logs automaticamente)
DELETE FROM pautas_events
WHERE LOWER(titulo) LIKE '%teste%descri%'
   OR LOWER(titulo) = 'teste'
   OR LOWER(descricao) LIKE '%teste%descri%';

-- Reabilitar RLS
ALTER TABLE pautas_events ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verificar que foi deletada
SELECT id, titulo, descricao FROM pautas_events 
WHERE LOWER(titulo) LIKE '%teste%';


-- ===========================================
-- OPÇÃO 2: VERIFICAR E CORRIGIR SEU USUÁRIO
-- ===========================================
-- Se a Opção 1 não funcionar, verifique seu usuário

SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE id = auth.uid();

-- Ver seus scopes atuais
SELECT 
  public.get_current_user_role() as role,
  public.has_scope('pautas_admin') as has_pautas_admin;

-- Se necessário, adicionar o scope pautas_admin ao seu usuário:
-- UPDATE profiles 
-- SET scopes = array_append(scopes, 'pautas_admin')
-- WHERE user_id = auth.uid()
-- AND NOT ('pautas_admin' = ANY(scopes));


-- ===========================================  
-- OPÇÃO 3: DELEÇÃO DIRETA VIA SERVICE ROLE
-- ===========================================
-- Use esta query no SQL Editor (que usa service role automaticamente)
-- Não precisa do auth.uid(), por isso bypassa RLS

DELETE FROM pautas_events
WHERE id IN (
  SELECT id FROM pautas_events 
  WHERE LOWER(titulo) LIKE '%teste%'
  LIMIT 10
);

-- Verificação final
SELECT COUNT(*) as pautas_teste_restantes
FROM pautas_events 
WHERE LOWER(titulo) LIKE '%teste%';
-- Deve retornar 0
