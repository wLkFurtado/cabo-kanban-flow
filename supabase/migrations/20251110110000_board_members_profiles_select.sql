-- Allow board members to view all memberships for boards they belong to
-- and see profiles of those members, enabling member selection in cards.

-- board_members: grant SELECT to members of the same board
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'board_members' AND polname = 'board_members_select_member'
  ) THEN
    -- Policy already exists
    NULL;
  ELSE
    CREATE POLICY board_members_select_member ON public.board_members
      FOR SELECT
      USING (
        board_id IN (
          SELECT bm.board_id FROM public.board_members bm WHERE bm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- profiles: grant SELECT to see profiles of members of boards the user belongs to
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND polname = 'profiles_select_board_members'
  ) THEN
    -- Policy already exists
    NULL;
  ELSE
    CREATE POLICY profiles_select_board_members ON public.profiles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.board_members bm_self
          WHERE bm_self.user_id = auth.uid()
            AND EXISTS (
              SELECT 1
              FROM public.board_members bm_other
              WHERE bm_other.board_id = bm_self.board_id
                AND bm_other.user_id = profiles.id
            )
        )
      );
  END IF;
END $$;