-- =====================================================
-- DIAGNÓSTICO: Perfis Órfãos e Bloqueios de Exclusão
-- =====================================================
-- Este script identifica:
-- 1. Perfis que existem em profiles mas não em auth.users
-- 2. Perfis que não podem ser excluídos devido a foreign keys
-- 3. Registros que referenciam perfis inexistentes
-- =====================================================

-- 1. Perfis órfãos (existem em profiles mas não em auth.users)
SELECT 
  '1. PERFIS ÓRFÃOS (profiles sem auth.users)' as diagnostico,
  COUNT(*) as total
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- Listar os perfis órfãos
SELECT 
  '   Detalhes dos perfis órfãos:' as info,
  p.id,
  p.email,
  p.full_name,
  p.cargo,
  p.created_at
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
)
ORDER BY p.created_at DESC;

-- 2. Perfis que têm atividades de cards (impedem exclusão)
SELECT 
  '2. PERFIS COM ATIVIDADES (bloqueiam exclusão)' as diagnostico,
  COUNT(DISTINCT user_id) as total_perfis,
  COUNT(*) as total_atividades
FROM public.card_activities;

-- Detalhes dos perfis com atividades
SELECT 
  '   Perfis com atividades:' as info,
  ca.user_id,
  p.email,
  p.full_name,
  COUNT(*) as num_atividades
FROM public.card_activities ca
LEFT JOIN public.profiles p ON ca.user_id = p.id
GROUP BY ca.user_id, p.email, p.full_name
ORDER BY num_atividades DESC;

-- 3. Perfis que criaram contatos institucionais
SELECT 
  '3. PERFIS COM CONTATOS INSTITUCIONAIS (bloqueiam exclusão)' as diagnostico,
  COUNT(DISTINCT created_by) as total_perfis,
  COUNT(*) as total_contatos
FROM public.institutional_contacts
WHERE created_by IS NOT NULL;

-- Detalhes
SELECT 
  '   Perfis que criaram contatos institucionais:' as info,
  ic.created_by,
  p.email,
  p.full_name,
  COUNT(*) as num_contatos_criados
FROM public.institutional_contacts ic
LEFT JOIN public.profiles p ON ic.created_by = p.id
WHERE ic.created_by IS NOT NULL
GROUP BY ic.created_by, p.email, p.full_name
ORDER BY num_contatos_criados DESC;

-- 4. Atividades órfãs (user_id aponta para perfil inexistente)
SELECT 
  '4. ATIVIDADES ÓRFÃS (user_id inexistente)' as diagnostico,
  COUNT(*) as total
FROM public.card_activities ca
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = ca.user_id
);

-- 5. Contatos institucionais órfãos (created_by aponta para perfil inexistente)
SELECT 
  '5. CONTATOS INSTITUCIONAIS ÓRFÃOS (created_by inexistente)' as diagnostico,
  COUNT(*) as total
FROM public.institutional_contacts ic
WHERE ic.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = ic.created_by
  );

-- =====================================================
-- RESUMO EXECUTIVO
-- =====================================================
SELECT 
  '==================== RESUMO ====================' as titulo;
  
SELECT 
  'Total de perfis órfãos (podem ser excluídos):' as metrica,
  COUNT(*) as valor
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

SELECT 
  'Perfis bloqueados por atividades:' as metrica,
  COUNT(DISTINCT user_id) as valor
FROM public.card_activities;

SELECT 
  'Perfis bloqueados por contatos institucionais:' as metrica,
  COUNT(DISTINCT created_by) as valor
FROM public.institutional_contacts
WHERE created_by IS NOT NULL;
