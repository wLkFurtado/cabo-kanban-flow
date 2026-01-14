-- =====================================================
-- FIX: Adicionar ON DELETE para foreign keys de profiles
-- =====================================================
-- Este script corrige as foreign keys que impedem a exclusão
-- de perfis em cascata, adicionando ON DELETE SET NULL
-- para preservar o histórico de dados.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. Corrigir card_activities.user_id
-- =====================================================

-- Remover a constraint antiga (sem ON DELETE)
ALTER TABLE public.card_activities
  DROP CONSTRAINT IF EXISTS card_activities_user_id_fkey;

-- Adicionar nova constraint com ON DELETE SET NULL
-- Isso permite que o histórico de atividades seja preservado
-- mesmo quando o usuário for excluído
ALTER TABLE public.card_activities
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.card_activities
  ADD CONSTRAINT card_activities_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- =====================================================
-- 2. Corrigir institutional_contacts.created_by
-- =====================================================

-- Remover a constraint antiga (sem ON DELETE)
ALTER TABLE public.institutional_contacts
  DROP CONSTRAINT IF EXISTS institutional_contacts_created_by_fkey;

-- Adicionar nova constraint com ON DELETE SET NULL
-- Isso preserva o registro do contato institucional
-- mesmo quando o criador for excluído
ALTER TABLE public.institutional_contacts
  ADD CONSTRAINT institutional_contacts_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

COMMIT;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar as constraints atualizadas
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  confdeltype as on_delete_action,
  CASE confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END as delete_action_description
FROM pg_constraint
WHERE confrelid = 'public.profiles'::regclass
  AND conname IN (
    'card_activities_user_id_fkey',
    'institutional_contacts_created_by_fkey'
  )
ORDER BY conrelid::regclass::text, conname;
