-- Fix infinite recursion in boards INSERT policy

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "boards_insert" ON boards;

-- Create a simple INSERT policy that only checks the owner_id
CREATE POLICY "boards_insert" ON boards
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Also ensure the SELECT policy for owned boards is correct
DROP POLICY IF EXISTS "boards_select_owner" ON boards;
CREATE POLICY "boards_select_owner" ON boards
  FOR SELECT USING (owner_id = auth.uid());

-- Fix the member SELECT policy to avoid recursion
DROP POLICY IF EXISTS "boards_select_member" ON boards;
CREATE POLICY "boards_select_member" ON boards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_members 
      WHERE board_id = boards.id AND user_id = auth.uid()
    )
  );