-- SOLUÇÃO NUCLEAR: Execute esta query no Supabase para DESABILITAR COMPLETAMENTE o RLS
-- e depois reabilitar com políticas limpas
-- ATENÇÃO: Execute cada bloco SEPARADAMENTE no SQL Editor

-- ============================================================================
-- PASSO 1: Desabilitar RLS temporariamente
-- ============================================================================
ALTER TABLE public.board_members DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 2: Remover TODAS as políticas existentes
-- ============================================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'board_members') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.board_members', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================================================
-- PASSO 3: Reabilitar RLS
-- ============================================================================
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 4: Criar políticas simples e limpas (SEM RECURSÃO)
-- ============================================================================

-- SELECT: Ver próprias memberships E memberships de boards próprios
CREATE POLICY "board_members_select_v2" ON public.board_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_members.board_id AND b.owner_id = auth.uid()
    )
    OR
    public.get_current_user_role() = 'admin'
  );

-- INSERT: Qualquer usuário autenticado pode adicionar membros
CREATE POLICY "board_members_insert_v2" ON public.board_members
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- UPDATE: Apenas owners e admins
CREATE POLICY "board_members_update_v2" ON public.board_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_members.board_id AND b.owner_id = auth.uid()
    )
    OR
    public.get_current_user_role() = 'admin'
  );

-- DELETE: Owners, admins, ou auto-remoção
CREATE POLICY "board_members_delete_v2" ON public.board_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_members.board_id AND b.owner_id = auth.uid()
    )
    OR
    public.get_current_user_role() = 'admin'
    OR
    user_id = auth.uid()
  );

-- ============================================================================
-- PASSO 5: Verificar que funcionou
-- ============================================================================
SELECT 
    'Políticas ativas:' as status,
    COUNT(*) as total
FROM pg_policies 
WHERE tablename = 'board_members';
