-- ============================================================================
-- APLICAR MIGRATION DE RASTREAMENTO DE EQUIPAMENTOS
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================

-- 1. Adicionar colunas de rastreamento na tabela equipment_loans
ALTER TABLE public.equipment_loans
ADD COLUMN IF NOT EXISTS loaned_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS returned_by UUID REFERENCES public.profiles(id);

-- 2. Adicionar comentários para documentação
COMMENT ON COLUMN public.equipment_loans.loaned_by IS 'User who loaned the equipment to someone';
COMMENT ON COLUMN public.equipment_loans.returned_by IS 'User who processed the return';

-- 3. Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'equipment_loans'
AND column_name IN ('loaned_by', 'returned_by');

-- ✅ Se você ver as duas colunas listadas, a migration foi aplicada com sucesso!
