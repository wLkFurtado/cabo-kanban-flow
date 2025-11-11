-- Resolver bloqueio de INSERT em card_members causado por recursão/visibilidade RLS
-- ao referenciar cards/board_members nas políticas. Usamos funções SECURITY DEFINER
-- para avaliar o board do card e a vinculação de usuários ao board sem depender
-- da visibilidade RLS do ator.

-- Função: obter o board_id de um card
CREATE OR REPLACE FUNCTION public.get_card_board_id(p_card_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bl.board_id
  FROM public.cards c
  JOIN public.board_lists bl ON c.list_id = bl.id
  WHERE c.id = p_card_id
$$;

-- Função: verificar se um usuário é membro (ou dono) do board
CREATE OR REPLACE FUNCTION public.is_board_member(p_board_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = p_board_id AND b.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.board_members bm
    WHERE bm.board_id = p_board_id AND bm.user_id = p_user_id
  );
$$;

-- Garantir que usuários autenticados possam executar as funções
GRANT EXECUTE ON FUNCTION public.get_card_board_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_board_member(uuid, uuid) TO authenticated;

-- Remover políticas anteriores potencialmente conflitantes
DROP POLICY IF EXISTS "card_members_insert_by_board_members" ON public.card_members;
DROP POLICY IF EXISTS "card_members_update_by_board_members" ON public.card_members;
DROP POLICY IF EXISTS "card_members_delete_by_board_members" ON public.card_members;
DROP POLICY IF EXISTS "card_members_insert_same_board_only" ON public.card_members;
DROP POLICY IF EXISTS "card_members_update_same_board_only" ON public.card_members;

-- INSERT: permitir que membros/dono do board do card adicionem apenas usuários do mesmo board
CREATE POLICY "card_members_insert_board_functions" ON public.card_members
  FOR INSERT
  WITH CHECK (
    public.is_board_member(public.get_card_board_id(card_id), auth.uid())
    AND public.is_board_member(public.get_card_board_id(card_id), user_id)
  );

-- UPDATE: permitir atualização por membros/dono e manter user_id dentro do mesmo board
CREATE POLICY "card_members_update_board_functions" ON public.card_members
  FOR UPDATE
  USING (
    public.is_board_member(public.get_card_board_id(card_id), auth.uid())
  )
  WITH CHECK (
    public.is_board_member(public.get_card_board_id(card_id), user_id)
  );

-- DELETE: permitir remoção por membros/dono do board do card
CREATE POLICY "card_members_delete_board_functions" ON public.card_members
  FOR DELETE
  USING (
    public.is_board_member(public.get_card_board_id(card_id), auth.uid())
  );

-- Admin bypass para card_members, alinhado ao bypass já existente em outras tabelas
-- Recriar política de bypass de admin de forma idempotente
DROP POLICY IF EXISTS admin_all_card_members ON public.card_members;
CREATE POLICY admin_all_card_members ON public.card_members
  FOR ALL
  USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');