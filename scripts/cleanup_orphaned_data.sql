-- =====================================================
-- LIMPEZA: Dados Órfãos
-- =====================================================
-- Este script remove dados órfãos do banco de dados:
-- 1. Perfis que não existem mais em auth.users
-- 2. Atividades que referenciam perfis inexistentes
-- 3. Contatos institucionais que referenciam perfis inexistentes
-- =====================================================

BEGIN;

-- =====================================================
-- AVISO: Este script faz alterações PERMANENTES
-- Execute o diagnostic_orphaned_profiles.sql ANTES
-- para entender o impacto!
-- =====================================================

-- Passo 1: Limpar atividades órfãs (user_id aponta para perfil inexistente)
-- Como agora temos ON DELETE SET NULL, podemos simplesmente setar como NULL
UPDATE public.card_activities
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_id
  );

-- Log do resultado
SELECT 'Atividades atualizadas (user_id -> NULL):' as acao, COUNT(*) as total
FROM public.card_activities
WHERE user_id IS NULL;

-- Passo 2: Limpar contatos institucionais órfãos
UPDATE public.institutional_contacts
SET created_by = NULL
WHERE created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = created_by
  );

-- Log do resultado
SELECT 'Contatos institucionais atualizados (created_by -> NULL):' as acao, COUNT(*) as total
FROM public.institutional_contacts
WHERE created_by IS NULL;

-- Passo 3: EXCLUIR perfis órfãos (que não existem em auth.users)
-- Agora que as foreign keys estão corrigidas, podemos excluir sem problemas
DELETE FROM public.profiles
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = profiles.id
);

-- Log do resultado
SELECT 
  'Perfis órfãos excluídos:' as acao,
  (
    SELECT COUNT(*) 
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = p.id
    )
  ) as total_restante;

COMMIT;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Deve retornar 0 para cada consulta
SELECT 'Verificação: Perfis órfãos restantes' as check_name, COUNT(*) as total
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

SELECT 'Verificação: Atividades órfãs restantes' as check_name, COUNT(*) as total
FROM public.card_activities ca
WHERE ca.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = ca.user_id
  );

SELECT 'Verificação: Contatos institucionais órfãos restantes' as check_name, COUNT(*) as total
FROM public.institutional_contacts ic
WHERE ic.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = ic.created_by
  );

-- =====================================================
-- RESUMO FINAL
-- =====================================================
SELECT '==================== LIMPEZA CONCLUÍDA ====================' as status;

SELECT 'Total de perfis ativos:' as metrica, COUNT(*) as valor
FROM public.profiles;

SELECT 'Total de atividades:' as metrica, COUNT(*) as valor
FROM public.card_activities;

SELECT 'Total de contatos institucionais:' as metrica, COUNT(*) as valor
FROM public.institutional_contacts;
