-- Script para corrigir políticas RLS que estão causando recursão infinita
-- Execute este script diretamente no banco de dados Supabase

-- 1. Desabilitar RLS temporariamente para fazer as correções
ALTER TABLE boards DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas problemáticas
DROP POLICY IF EXISTS "boards_insert" ON boards;
DROP POLICY IF EXISTS "boards_select_owner" ON boards;
DROP POLICY IF EXISTS "boards_select_member" ON boards;
DROP POLICY IF EXISTS "boards_update" ON boards;
DROP POLICY IF EXISTS "boards_delete" ON boards;

-- 3. Recriar políticas simples e sem recursão
CREATE POLICY "boards_insert" ON boards
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "boards_select_owner" ON boards
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "boards_select_member" ON boards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_members 
      WHERE board_id = boards.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "boards_update" ON boards
  FOR UPDATE USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM board_members 
      WHERE board_id = boards.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "boards_delete" ON boards
  FOR DELETE USING (owner_id = auth.uid());

-- 4. Reabilitar RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'boards'
ORDER BY policyname;