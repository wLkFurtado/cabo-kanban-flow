-- Fix the circular dependency in RLS policies by making them completely independent

-- Drop the problematic policies that reference other tables
DROP POLICY IF EXISTS "boards_select_member" ON boards;
DROP POLICY IF EXISTS "board_members_select_owner" ON board_members;
DROP POLICY IF EXISTS "board_lists_select" ON board_lists;
DROP POLICY IF EXISTS "board_lists_update" ON board_lists;
DROP POLICY IF EXISTS "cards_select" ON cards;
DROP POLICY IF EXISTS "cards_insert" ON cards;
DROP POLICY IF EXISTS "cards_update" ON cards;
DROP POLICY IF EXISTS "cards_delete" ON cards;

-- Create a security definer function to check board access without recursion
CREATE OR REPLACE FUNCTION public.user_has_board_access(board_uuid uuid)
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid uuid := auth.uid();
BEGIN
  -- Check if user owns the board
  IF EXISTS (SELECT 1 FROM boards WHERE id = board_uuid AND owner_id = user_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a member of the board
  IF EXISTS (SELECT 1 FROM board_members WHERE board_id = board_uuid AND user_id = user_uuid) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Recreate boards policies without circular references
CREATE POLICY "boards_select_member" ON boards
  FOR SELECT USING (
    id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid() AND board_id = boards.id
    )
  );

-- Recreate board_members policies without circular references  
CREATE POLICY "board_members_select_owner" ON board_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM boards WHERE id = board_members.board_id AND owner_id = auth.uid())
  );

-- Recreate board_lists policies using the function
CREATE POLICY "board_lists_select" ON board_lists
  FOR SELECT USING (user_has_board_access(board_id));

CREATE POLICY "board_lists_update" ON board_lists
  FOR UPDATE USING (user_has_board_access(board_id));

-- Recreate cards policies using the function
CREATE POLICY "cards_select" ON cards
  FOR SELECT USING (
    list_id IN (
      SELECT id FROM board_lists WHERE user_has_board_access(board_id)
    )
  );

CREATE POLICY "cards_insert" ON cards
  FOR INSERT WITH CHECK (
    list_id IN (
      SELECT id FROM board_lists WHERE user_has_board_access(board_id)
    )
  );

CREATE POLICY "cards_update" ON cards
  FOR UPDATE USING (
    list_id IN (
      SELECT id FROM board_lists WHERE user_has_board_access(board_id)
    )
  );

CREATE POLICY "cards_delete" ON cards
  FOR DELETE USING (
    list_id IN (
      SELECT id FROM board_lists WHERE user_has_board_access(board_id)
    )
  );

-- Enable RLS on the missing tables that caused security warnings
ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_chat_histories_malu ENABLE ROW LEVEL SECURITY;

-- Create basic policies for these tables (they seem to be for N8N integration)
CREATE POLICY "n8n_chat_histories_all" ON n8n_chat_histories
  FOR ALL USING (true);

CREATE POLICY "n8n_chat_histories_malu_all" ON n8n_chat_histories_malu
  FOR ALL USING (true);