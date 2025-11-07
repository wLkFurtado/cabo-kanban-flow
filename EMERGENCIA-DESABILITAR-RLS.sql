-- 🚨 SOLUÇÃO DE EMERGÊNCIA - DESABILITAR RLS TEMPORARIAMENTE

-- 1. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- 2. DESABILITAR RLS COMPLETAMENTE (TEMPORÁRIO)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. ADICIONAR COLUNA CARGO SE NÃO EXISTIR
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT;

-- 4. ATUALIZAR PERFIS EXISTENTES COM CARGOS
UPDATE public.profiles 
SET cargo = CASE 
    WHEN role = 'admin' THEN 'Administrador'
    WHEN role = 'manager' THEN 'Gerente'
    WHEN role = 'user' THEN 'Usuário'
    ELSE 'Não informado'
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
FROM public.profiles
ORDER BY created_at DESC;