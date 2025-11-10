-- Grant DELETE permissions on cards to admin users
-- This complements existing SELECT policies and resolves cases where admins
-- can view cards but cannot delete due to RLS.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'cards' AND policyname = 'admin_delete_cards_all'
  ) THEN
    EXECUTE $$
      CREATE POLICY "admin_delete_cards_all" ON public.cards
        FOR DELETE USING (public.get_current_user_role() = 'admin')
    $$;
  END IF;
END $$;