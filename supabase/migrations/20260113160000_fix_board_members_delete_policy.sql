-- Fix board_members DELETE policy to avoid infinite recursion
-- The previous approach caused recursion by querying board_members within a board_members policy
-- Solution: Use a security definer function that bypasses RLS

-- Step 1: Create a security definer function to check if user is a board member
CREATE OR REPLACE FUNCTION public.is_board_member(p_board_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = p_board_id AND user_id = p_user_id
  );
$$;

-- Step 2: Drop existing DELETE policies
DROP POLICY IF EXISTS "board_members_delete_simple" ON public.board_members;
DROP POLICY IF EXISTS "board_members_delete_owner_or_self" ON public.board_members;
DROP POLICY IF EXISTS "board_members_delete_v2" ON public.board_members;
DROP POLICY IF EXISTS "board_members_delete_by_members" ON public.board_members;

-- Step 3: Create new DELETE policy using the security definer function
CREATE POLICY "board_members_delete_non_recursive" ON public.board_members
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
    -- Any board member can remove other members (using security definer function)
    public.is_board_member(board_members.board_id, auth.uid())
  );

-- Verify the policy was created
DO $$
BEGIN
  RAISE NOTICE 'DELETE policy board_members_delete_non_recursive created successfully';
  RAISE NOTICE 'Using security definer function to avoid recursion';
END $$;
