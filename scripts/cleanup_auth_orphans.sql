-- =====================================================
-- LIMPEZA: Usuários Órfãos em auth.users
-- =====================================================
-- Este script identifica e remove usuários que existem
-- em auth.users mas NÃO existem em profiles
-- (foram excluídos do sistema mas não do auth)
-- =====================================================

-- PASSO 1: DIAGNÓSTICO
-- Listar usuários órfãos em auth.users
SELECT 
  '📊 USUÁRIOS ÓRFÃOS EM AUTH.USERS' as diagnostico,
  COUNT(*) as total
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Detalhar os usuários órfãos
SELECT 
  'Detalhes dos usuários órfãos:' as info,
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ORDER BY u.created_at DESC;

-- =====================================================
-- PASSO 2: EXCLUSÃO
-- ⚠️ ATENÇÃO: Isso vai EXCLUIR PERMANENTEMENTE!
-- =====================================================

-- Excluir usuários órfãos de auth.users
-- NOTA: Você precisa ter permissões de administrador
-- para executar DELETE em auth.users

-- Opção A: Excluir um usuário específico
-- Substitua 'email@exemplo.com' pelo email que deseja remover
DELETE FROM auth.users
WHERE email = 'hanniflinhares1@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.users.id
  );

-- Opção B: Excluir TODOS os usuários órfãos
-- ⚠️ USE COM CUIDADO!
-- DELETE FROM auth.users
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.profiles p WHERE p.id = auth.users.id
-- );

-- =====================================================
-- PASSO 3: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se ainda há usuários órfãos
SELECT 
  '✅ VERIFICAÇÃO: Usuários órfãos restantes' as check_name,
  COUNT(*) as total
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Listar todos os usuários ativos (devem ter profile)
SELECT 
  '📋 RESUMO: Total de usuários ativos com perfil' as metrica,
  COUNT(*) as total
FROM auth.users u
WHERE EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
