-- Permitir que QUALQUER MEMBRO do board possa convidar outros usuários
-- Antes, apenas o owner do board ou admin podiam adicionar membros.
-- Agora, qualquer pessoa que já seja membro do board pode adicionar novos membros.

-- 1. Remover a política antiga que restringe a owner/admin
DROP POLICY IF EXISTS "board_members_insert_owner_or_admin" ON public.board_members;

-- 2. Criar nova política que permite:
--    - Owner do board
--    - Admin do sistema
--    - OU qualquer membro existente do board
CREATE POLICY "board_members_insert_any_member" ON public.board_members
  FOR INSERT
  WITH CHECK (
    -- Owner do board pode adicionar
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_members.board_id AND b.owner_id = auth.uid()
    )
    OR
    -- Admin do sistema pode adicionar
    public.get_current_user_role() = 'admin'
    OR
    -- Qualquer membro existente do board pode adicionar novos membros
    EXISTS (
      SELECT 1 FROM public.board_members bm
      WHERE bm.board_id = board_members.board_id AND bm.user_id = auth.uid()
    )
  );
