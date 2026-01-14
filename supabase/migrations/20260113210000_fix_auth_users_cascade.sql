-- =====================================================
-- FIX: Adicionar ON DELETE CASCADE de auth.users → profiles
-- =====================================================
-- Este script garante que quando um usuário é excluído
-- de auth.users, o perfil em profiles também seja excluído
-- automaticamente (exclusão em cascata)
-- =====================================================

-- IMPORTANTE: A tabela profiles.id deve ter uma foreign key
-- para auth.users.id com ON DELETE CASCADE

-- Verificar a constraint atual
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  confdeltype as delete_type,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END as delete_action
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND confrelid = 'auth.users'::regclass;

-- Se a constraint não existir ou não tiver CASCADE, precisamos adicionar

-- Remover constraint antiga se existir
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Adicionar nova constraint com ON DELETE CASCADE
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Verificar se foi aplicado corretamente
SELECT 
  '✅ VERIFICAÇÃO: Constraint atualizada' as status,
  conname as constraint_name,
  CASE confdeltype
    WHEN 'c' THEN '✅ CASCADE'
    ELSE '❌ NÃO É CASCADE'
  END as delete_action
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND confrelid = 'auth.users'::regclass
  AND conname = 'profiles_id_fkey';
