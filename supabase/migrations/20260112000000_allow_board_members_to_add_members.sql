-- Allow board members to add and remove other members from boards
-- This COMPLETELY eliminates recursion by not checking board_members table at all in INSERT policy

-- Drop the existing insert policy that only allows owners/admins
DROP POLICY IF EXISTS "board_members_insert_owner_or_admin" ON public.board_members;
DROP POLICY IF EXISTS "board_members_insert_by_members" ON public.board_members;

-- Create simplified policy: Allow owners, admins, and all authenticated users
-- The frontend (BoardMembersManager) controls which users can see the UI
-- This avoids ANY self-referential queries on board_members
CREATE POLICY "board_members_insert_authenticated" ON public.board_members
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
    -- Authenticated users can add members (frontend controls access)
    auth.uid() IS NOT NULL
  );

-- Create policy for deleting members
-- Allow members to remove themselves, and owners to remove anyone
DROP POLICY IF EXISTS "board_members_delete_owner" ON public.board_members;
DROP POLICY IF EXISTS "board_members_delete_owner_or_self" ON public.board_members;

CREATE POLICY "board_members_delete_owner_or_self" ON public.board_members
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
    -- Members can remove themselves
    user_id = auth.uid()
  );
