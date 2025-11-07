-- 🔧 CORREÇÃO PARA RECURSÃO INFINITA NAS POLÍTICAS RLS (SINTAXE CORRIGIDA)

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
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

-- 2. DESABILITAR RLS TEMPORARIAMENTE
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR SE A COLUNA CARGO EXISTE E ADICIONAR SE NECESSÁRIO
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'cargo'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN cargo TEXT;
    END IF;
END $$;

-- 4. CRIAR POLÍTICAS RLS SIMPLES (SEM RECURSÃO E COM SINTAXE CORRETA)

-- Política para visualizar perfis (apenas próprio perfil)
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Política para inserir perfil próprio
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para atualizar perfil próprio
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 5. REABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. ATUALIZAR PERFIS EXISTENTES COM CARGOS PADRÃO
UPDATE public.profiles 
SET cargo = CASE 
    WHEN role = 'admin' THEN 'Administrador'
    WHEN role = 'manager' THEN 'Gerente'
    WHEN role = 'user' THEN 'Usuário'
    ELSE 'Não informado'
END
WHERE cargo IS NULL OR cargo = '';

-- 7. VERIFICAR RESULTADO
SELECT 
    id,
    email,
    full_name,
    cargo,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;