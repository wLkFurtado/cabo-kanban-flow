# 🔧 SOLUÇÃO DEFINITIVA - Problema dos Cargos

## 📋 Diagnóstico Confirmado

✅ **Funcionando:**
- Autenticação de usuários
- Tabela `profiles` existe
- Colunas básicas: `id`, `email`, `full_name`, `role`

❌ **Problemas identificados:**
1. **Coluna `cargo` NÃO existe** na tabela `profiles`
2. **Políticas RLS estão bloqueando inserções**
3. **Perfis existentes não têm dados** (por isso aparecem como "Não informado")

## 🎯 SOLUÇÃO COMPLETA

### Passo 1: Acesse o Supabase Dashboard
1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione seu projeto: **cabo-kanban-flow**
4. Vá para **SQL Editor** (ícone de código no menu lateral)

### Passo 2: Execute o SQL Completo

**COPIE E COLE EXATAMENTE ESTE SQL:**

```sql
-- 1. ADICIONAR COLUNA CARGO
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cargo TEXT;

-- 2. ATUALIZAR PERFIS EXISTENTES (se houver dados na coluna role)
UPDATE public.profiles 
SET cargo = CASE 
  WHEN role = 'admin' THEN 'Administrador'
  WHEN role = 'manager' THEN 'Gerente'
  WHEN role = 'user' THEN 'Usuário'
  ELSE 'Não informado'
END
WHERE cargo IS NULL;

-- 3. REMOVER POLÍTICAS RLS EXISTENTES (para recriar)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 4. CRIAR POLÍTICAS RLS CORRETAS
-- Política para visualizar perfis
CREATE POLICY "Users can view profiles" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Política para inserir perfil próprio
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para atualizar perfil próprio
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Política para admins gerenciarem todos os perfis
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR RESULTADO
SELECT 
  id,
  email,
  full_name,
  cargo,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;
```

### Passo 3: Clique em "RUN" para executar

### Passo 4: Verificar se funcionou
Após executar, você deve ver:
- ✅ A coluna `cargo` foi adicionada
- ✅ Os perfis existentes aparecem na consulta final
- ✅ As políticas RLS foram recriadas

## 🧪 Teste Final

Após aplicar o SQL, execute este comando no terminal para testar:

```bash
node test-new-user-with-cargo.mjs
```

**Resultado esperado:**
- ✅ Usuário criado com sucesso
- ✅ Perfil inserido com cargo
- ✅ Perfil aparece na lista
- ✅ Todos os perfis listados com cargos

## 🚨 Se ainda não funcionar

1. **Verifique se você está no projeto correto** no Supabase Dashboard
2. **Confirme que o SQL foi executado sem erros**
3. **Aguarde 1-2 minutos** para o cache atualizar
4. **Recarregue a página** da aplicação

## 📞 Próximos Passos

Após aplicar esta solução:
1. Os perfis existentes terão cargos baseados no `role`
2. Novos usuários poderão ser criados com cargo
3. A área administrativa mostrará os cargos corretamente
4. As políticas RLS funcionarão adequadamente

---

**⚠️ IMPORTANTE:** Execute TODO o SQL de uma vez só, não linha por linha!