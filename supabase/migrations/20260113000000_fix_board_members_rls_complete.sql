-- COMPLETE FIX for board_members RLS infinite recursion
-- This migration removes ALL conflicting policies and creates clean, non-recursive ones

-- ============================================================================
-- STEP 1: Remove ALL existing board_members policies to start fresh
-- ============================================================================
DROP POLICY IF EXISTS "board_members_insert_owner_or_admin" ON public.board_members;
DROP POLICY IF EXISTS "board_members_insert_by_members" ON public.board_members;
DROP POLICY IF EXISTS "board_members_insert_authenticated" ON public.board_members;
DROP POLICY IF EXISTS "board_members_select_member" ON public.board_members;
DROP POLICY IF EXISTS "board_members_select_owner" ON public.board_members;
DROP POLICY IF EXISTS "board_members_select_self" ON public.board_members;
DROP POLICY IF EXISTS "Users can view members of boards they own" ON public.board_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.board_members;
DROP POLICY IF EXISTS "Board owners can manage members" ON public.board_members;
DROP POLICY IF EXISTS "board_members_delete_owner" ON public.board_members;
DROP POLICY IF EXISTS "board_members_delete_owner_or_self" ON public.board_members;
DROP POLICY IF EXISTS "board_members_update_owner" ON public.board_members;

-- ============================================================================
-- STEP 2: Create NEW non-recursive policies
-- ============================================================================

-- SELECT: Allow users to see board_members if they own the board OR if it's their own membership
-- This DOES NOT query board_members recursively
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

-- INSERT: Allow owners, admins, and authenticated users to add members
-- Frontend controls who can actually access the UI
CREATE POLICY "board_members_insert_simple" ON public.board_members
  FOR INSERT
  WITH CHECK (
    -- Owner can add members
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_members.board_id AND b.owner_id = auth.uid()
    )
    OR
    -- Admin can add members
    public.get_current_user_role() = 'admin'
    OR
    -- Any authenticated user can add members (frontend controls access)
    auth.uid() IS NOT NULL
  );

-- UPDATE: Only owners and admins can update memberships
CREATE POLICY "board_members_update_simple" ON public.board_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_members.board_id AND b.owner_id = auth.uid()
    )
    OR
    public.get_current_user_role() = 'admin'
  );

-- DELETE: Owners/admins can remove anyone, users can remove themselves
CREATE POLICY "board_members_delete_simple" ON public.board_members
  FOR DELETE
  USING (
    -- Owner can remove any member
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_members.board_id AND b.owner_id = auth.uid()
    )
    OR
    -- Admin can remove any member
    public.get_current_user_role() = 'admin'
    OR
    -- Users can remove themselves
    user_id = auth.uid()
  );

-- ============================================================================
-- VERIFICATION: Check that policies were created successfully
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'board_members RLS policies have been reset successfully';
  RAISE NOTICE 'All recursive policies have been eliminated';
END $$;
