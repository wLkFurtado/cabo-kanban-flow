-- ========================================
-- SCRIPT FINAL: DESABILITAR RLS COMPLETAMENTE
-- ========================================
-- Execute este SQL no Supabase Dashboard
-- SQL Editor > New Query > Cole este código > Run

-- 1. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. DESABILITAR RLS COMPLETAMENTE
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR SE A COLUNA CARGO EXISTE (caso não exista, adicionar)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'cargo'
    ) THEN
        ALTER TABLE profiles ADD COLUMN cargo TEXT;
        RAISE NOTICE 'Coluna cargo adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna cargo já existe!';
    END IF;
END $$;

-- 4. ATUALIZAR PERFIS EXISTENTES COM CARGOS PADRÃO
UPDATE profiles 
SET cargo = CASE 
    WHEN role = 'admin' THEN 'Administrador'
    WHEN role = 'user' THEN 'Usuário'
    ELSE 'Usuário'
END
WHERE cargo IS NULL OR cargo = '';

-- 5. VERIFICAR RESULTADO
SELECT 
    id,
    email,
    full_name,
    cargo,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. CONFIRMAR STATUS DO RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- ========================================
-- RESULTADO ESPERADO:
-- - RLS desabilitado (rls_enabled = false)
-- - Perfis existentes com cargos atualizados
-- - Novos registros poderão ser inseridos sem erro
-- ========================================