-- Allow board owners or admins to add members to a board
-- This policy complements the simplified SELECT policy and fixes RLS 42501
-- raised when inserting into public.board_members.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'board_members' AND policyname = 'board_members_insert_owner_or_admin'
  ) THEN
    EXECUTE $$
      CREATE POLICY "board_members_insert_owner_or_admin" ON public.board_members
        FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.boards b
            WHERE b.id = board_members.board_id AND b.owner_id = auth.uid()
          )
          OR
          public.get_current_user_role() = 'admin'
        )
    $$;
  END IF;
END $$;