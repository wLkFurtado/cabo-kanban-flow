-- Ajuste de políticas RLS para permitir que QUALQUER membro do board
-- possa gerenciar membros dos cards (INSERT/UPDATE/DELETE), além de SELECT.

-- Observação: Em Postgres RLS, INSERT usa apenas WITH CHECK; UPDATE/DELETE usam USING
-- (e UPDATE também pode usar WITH CHECK para novos valores). Este arquivo cria
-- políticas específicas com nomes distintos para evitar conflito com políticas existentes.

-- INSERT: permitir a membros do board (ou owner) inserir membros em cards do board
CREATE POLICY "card_members_insert_by_board_members" ON public.card_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.board_lists bl ON c.list_id = bl.id
      JOIN public.boards b ON bl.board_id = b.id
      WHERE c.id = card_id AND (
        b.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.board_members bm
          WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        )
      )
    )
  );

-- UPDATE: permitir atualização de linhas de card_members dentro de boards acessíveis
CREATE POLICY "card_members_update_by_board_members" ON public.card_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.board_lists bl ON c.list_id = bl.id
      JOIN public.boards b ON bl.board_id = b.id
      WHERE c.id = card_id AND (
        b.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.board_members bm
          WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.board_lists bl ON c.list_id = bl.id
      JOIN public.boards b ON bl.board_id = b.id
      WHERE c.id = card_id AND (
        b.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.board_members bm
          WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        )
      )
    )
  );

-- DELETE: permitir remoção de membros de cards dentro de boards acessíveis
CREATE POLICY "card_members_delete_by_board_members" ON public.card_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.board_lists bl ON c.list_id = bl.id
      JOIN public.boards b ON bl.board_id = b.id
      WHERE c.id = card_id AND (
        b.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.board_members bm
          WHERE bm.board_id = b.id AND bm.user_id = auth.uid()
        )
      )
    )
  );

-- Nota: Mantemos a política existente de SELECT ("Users can view card members in accessible boards")
-- e a política "Board members can manage card members" (FOR ALL USING), mas esta última
-- não cobre INSERT; por isso, criamos as políticas específicas acima.