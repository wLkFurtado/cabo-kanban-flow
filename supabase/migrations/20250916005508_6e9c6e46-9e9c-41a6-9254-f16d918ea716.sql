-- Fix infinite recursion in RLS policies by simplifying them

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Board owners can delete boards" ON boards;
DROP POLICY IF EXISTS "Board owners can update boards" ON boards;
DROP POLICY IF EXISTS "Users can create boards" ON boards;
DROP POLICY IF EXISTS "Users can view boards where they are members" ON boards;
DROP POLICY IF EXISTS "Users can view their own boards" ON boards;

DROP POLICY IF EXISTS "Board members can manage lists" ON board_lists;
DROP POLICY IF EXISTS "Board owners can manage lists" ON board_lists;
DROP POLICY IF EXISTS "Users can view lists of member boards" ON board_lists;
DROP POLICY IF EXISTS "Users can view lists of owned boards" ON board_lists;

DROP POLICY IF EXISTS "Board owners can manage members" ON board_members;
DROP POLICY IF EXISTS "Users can view members of boards they own" ON board_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON board_members;

DROP POLICY IF EXISTS "Board members can manage cards" ON cards;
DROP POLICY IF EXISTS "Board owners can manage cards" ON cards;
DROP POLICY IF EXISTS "Users can view cards in member boards" ON cards;
DROP POLICY IF EXISTS "Users can view cards in owned boards" ON cards;

-- Create simple, non-recursive policies for boards
CREATE POLICY "boards_select_owned" ON boards
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "boards_select_member" ON boards
  FOR SELECT USING (
    id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "boards_insert" ON boards
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "boards_update_owner" ON boards
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "boards_delete_owner" ON boards
  FOR DELETE USING (owner_id = auth.uid());

-- Create simple policies for board_lists
CREATE POLICY "board_lists_select" ON board_lists
  FOR SELECT USING (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
      UNION
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "board_lists_insert" ON board_lists
  FOR INSERT WITH CHECK (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "board_lists_update" ON board_lists
  FOR UPDATE USING (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
      UNION
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "board_lists_delete" ON board_lists
  FOR DELETE USING (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
  );

-- Create simple policies for board_members
CREATE POLICY "board_members_select_owner" ON board_members
  FOR SELECT USING (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
  );

CREATE POLICY "board_members_select_self" ON board_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "board_members_insert_owner" ON board_members
  FOR INSERT WITH CHECK (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
  );

CREATE POLICY "board_members_update_owner" ON board_members
  FOR UPDATE USING (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
  );

CREATE POLICY "board_members_delete_owner" ON board_members
  FOR DELETE USING (
    board_id IN (SELECT id FROM boards WHERE owner_id = auth.uid())
  );

-- Create simple policies for cards
CREATE POLICY "cards_select" ON cards
  FOR SELECT USING (
    list_id IN (
      SELECT id FROM board_lists WHERE board_id IN (
        SELECT id FROM boards WHERE owner_id = auth.uid()
        UNION
        SELECT board_id FROM board_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "cards_insert" ON cards
  FOR INSERT WITH CHECK (
    list_id IN (
      SELECT id FROM board_lists WHERE board_id IN (
        SELECT id FROM boards WHERE owner_id = auth.uid()
        UNION
        SELECT board_id FROM board_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "cards_update" ON cards
  FOR UPDATE USING (
    list_id IN (
      SELECT id FROM board_lists WHERE board_id IN (
        SELECT id FROM boards WHERE owner_id = auth.uid()
        UNION
        SELECT board_id FROM board_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "cards_delete" ON cards
  FOR DELETE USING (
    list_id IN (
      SELECT id FROM board_lists WHERE board_id IN (
        SELECT id FROM boards WHERE owner_id = auth.uid()
        UNION
        SELECT board_id FROM board_members WHERE user_id = auth.uid()
      )
    )
  );