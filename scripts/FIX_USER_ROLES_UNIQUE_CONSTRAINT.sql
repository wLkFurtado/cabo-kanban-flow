-- ============================================================================
-- ADICIONAR UNIQUE CONSTRAINT EM user_id
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================

-- 1. REMOVER CONSTRAINT DUPLICADA (user_id, role)
-- Essa constraint permite múltiplos registros para o mesmo user_id com diferentes roles
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- 2. ADICIONAR CONSTRAINT ÚNICA PARA user_id
-- Isso garante que cada usuário tenha apenas um registro em user_roles
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 3. VERIFICAR O RESULTADO
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_roles' AND table_schema = 'public';
