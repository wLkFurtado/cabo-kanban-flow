-- =====================================================
-- FIX: Verificar e garantir CASCADE deletion completo
-- =====================================================
-- Este script garante que quando um usuário é excluído
-- de auth.users, TODOS os dados relacionados sejam
-- excluídos em cascata corretamente
-- =====================================================

-- ========================================
-- PARTE 1: Garantir CASCADE de auth.users → profiles
-- ========================================

-- Verificar constraint atual
DO $$
BEGIN
    RAISE NOTICE '=== Verificando constraint profiles.id → auth.users.id ===';
END $$;

SELECT 
  conname as constraint_name,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE ✅'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END as current_delete_action
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND confrelid = 'auth.users'::regclass;

-- Remover constraint antiga se não for CASCADE
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Adicionar nova constraint com ON DELETE CASCADE
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- ========================================
-- PARTE 2: Verificar todas as FKs que referenciam profiles
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '=== Foreign Keys que referenciam public.profiles ===';
END $$;

SELECT 
  conrelid::regclass as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE ✅'
    WHEN 'n' THEN 'SET NULL ⚠️'
    WHEN 'd' THEN 'SET DEFAULT'
  END as delete_action
FROM pg_constraint
WHERE confrelid = 'public.profiles'::regclass
  AND contype = 'f'
ORDER BY conrelid::regclass::text;

-- ========================================
-- PARTE 3: Verificar todas as FKs que referenciam auth.users
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '=== Foreign Keys que referenciam auth.users ===';
END $$;

SELECT 
  conrelid::regclass as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE ✅'
    WHEN 'n' THEN 'SET NULL ⚠️'
    WHEN 'd' THEN 'SET DEFAULT'
  END as delete_action
FROM pg_constraint
WHERE confrelid = 'auth.users'::regclass
  AND contype = 'f'
ORDER BY conrelid::regclass::text;

-- ========================================
-- PARTE 4: Resumo Final
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '=== RESUMO DA CONFIGURAÇÃO DE CASCADE ===';
    RAISE NOTICE 'Quando um usuário é excluído de auth.users:';
    RAISE NOTICE '1. profiles → será excluído em CASCADE';
    RAISE NOTICE '2. user_roles → será excluído em CASCADE (via profiles)';
    RAISE NOTICE '3. boards (owner) → será excluído em CASCADE (via profiles)';
    RAISE NOTICE '4. board_members → será excluído em CASCADE (via profiles)';
    RAISE NOTICE '5. card_members → será excluído em CASCADE (via profiles)';
    RAISE NOTICE '6. card_comments → será excluído em CASCADE (via profiles)';
    RAISE NOTICE '7. events (created_by) → será excluído em CASCADE (via profiles)';
    RAISE NOTICE '8. pautas_events (criado_por) → será excluído em CASCADE (via profiles)';
    RAISE NOTICE '9. pautas_participants → será excluído em CASCADE (via profiles)';
    RAISE NOTICE '10. cards (created_by) → será SET NULL (mantém card, remove criador)';
    RAISE NOTICE '11. pautas_events (responsavel_id) → será SET NULL (mantém evento)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migração concluída com sucesso!';
END $$;
