-- FINAL FIX: Remove recursive board_members_select_member policy
-- This policy causes infinite recursion because it queries board_members within a board_members SELECT policy

-- ============================================================================
-- STEP 1: Drop the problematic recursive policy
-- ============================================================================
DROP POLICY IF EXISTS "board_members_select_member" ON public.board_members;

-- ============================================================================
-- STEP 2: Ensure clean, non-recursive SELECT policy exists
-- ============================================================================
-- If board_members_select_simple doesn't exist yet, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'board_members' 
    AND policyname = 'board_members_select_simple'
  ) THEN
    CREATE POLICY "board_members_select_simple" ON public.board_members
      FOR SELECT
      USING (
        -- User can see their own memberships
        user_id = auth.uid()
        OR
        -- Board owner can see all members
        EXISTS (
          SELECT 1 FROM public.boards b
          WHERE b.id = board_members.board_id AND b.owner_id = auth.uid()
        )
        OR
        -- Admins can see all
        public.get_current_user_role() = 'admin'
      );
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION: Log success
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Recursive board_members_select_member policy has been removed';
  RAISE NOTICE 'Non-recursive board_members_select_simple policy is active';
END $$;
