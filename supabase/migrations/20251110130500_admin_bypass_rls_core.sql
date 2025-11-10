-- Admin bypass RLS in core tables: boards, board_lists, board_members, cards, card_activities
-- Grants full control to admin via public.get_current_user_role() = 'admin'.

DO $$
BEGIN
  -- boards: FOR ALL
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='boards' AND policyname='admin_all_boards') THEN
    EXECUTE $$
      CREATE POLICY admin_all_boards ON public.boards
        FOR ALL
        USING (public.get_current_user_role() = 'admin')
        WITH CHECK (public.get_current_user_role() = 'admin')
    $$;
  END IF;

  -- board_lists: FOR ALL
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='board_lists' AND policyname='admin_all_board_lists') THEN
    EXECUTE $$
      CREATE POLICY admin_all_board_lists ON public.board_lists
        FOR ALL
        USING (public.get_current_user_role() = 'admin')
        WITH CHECK (public.get_current_user_role() = 'admin')
    $$;
  END IF;

  -- board_members: FOR ALL
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='board_members' AND policyname='admin_all_board_members') THEN
    EXECUTE $$
      CREATE POLICY admin_all_board_members ON public.board_members
        FOR ALL
        USING (public.get_current_user_role() = 'admin')
        WITH CHECK (public.get_current_user_role() = 'admin')
    $$;
  END IF;

  -- cards: FOR ALL
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cards' AND policyname='admin_all_cards') THEN
    EXECUTE $$
      CREATE POLICY admin_all_cards ON public.cards
        FOR ALL
        USING (public.get_current_user_role() = 'admin')
        WITH CHECK (public.get_current_user_role() = 'admin')
    $$;
  END IF;

  -- card_activities: FOR ALL
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='card_activities' AND policyname='admin_all_card_activities') THEN
    EXECUTE $$
      CREATE POLICY admin_all_card_activities ON public.card_activities
        FOR ALL
        USING (public.get_current_user_role() = 'admin')
        WITH CHECK (public.get_current_user_role() = 'admin')
    $$;
  END IF;
END $$;