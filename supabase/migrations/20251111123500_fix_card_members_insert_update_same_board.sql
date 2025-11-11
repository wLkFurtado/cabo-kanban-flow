-- Refinar políticas de card_members para restringir o alvo (user_id)
-- aos usuários vinculados ao MESMO board do card.

-- Remover políticas anteriores para evitar sobreposição permissiva
DROP POLICY IF EXISTS "card_members_insert_by_board_members" ON public.card_members;
DROP POLICY IF EXISTS "card_members_update_by_board_members" ON public.card_members;

-- INSERT: ator deve ser owner ou membro do board do card
-- E o user_id inserido deve ser membro do MESMO board
CREATE POLICY "card_members_insert_same_board_only" ON public.card_members
  FOR INSERT
  WITH CHECK (
    -- Ator é owner ou membro do board do card
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
    AND
    -- Alvo (user_id) também é membro do MESMO board
    EXISTS (
      SELECT 1 FROM public.cards c2
      JOIN public.board_lists bl2 ON c2.list_id = bl2.id
      JOIN public.board_members bm_target ON bm_target.board_id = bl2.board_id
      WHERE c2.id = card_id AND bm_target.user_id = user_id
    )
  );

-- UPDATE: ator deve ser owner ou membro do board do card (USING)
-- E o novo valor deve manter o user_id como membro do MESMO board (WITH CHECK)
CREATE POLICY "card_members_update_same_board_only" ON public.card_members
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
      SELECT 1 FROM public.cards c2
      JOIN public.board_lists bl2 ON c2.list_id = bl2.id
      JOIN public.board_members bm_target ON bm_target.board_id = bl2.board_id
      WHERE c2.id = card_id AND bm_target.user_id = user_id
    )
  );

-- DELETE permanece permitido aos membros/owner pelo USING da política ampla existente
-- ("Board members can manage card members") e/ou por uma política específica criada anteriormente.