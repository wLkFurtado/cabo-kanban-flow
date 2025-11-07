-- Debug migration to understand board access behavior
-- This migration adds logging and verification for board access policies

-- First, let's verify the current policies are in place
DO $$
BEGIN
    -- Check if the expected policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'boards' AND policyname = 'boards_select_owner_simple'
    ) THEN
        RAISE NOTICE 'Missing policy: boards_select_owner_simple';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'boards' AND policyname = 'boards_select_member'
    ) THEN
        RAISE NOTICE 'Missing policy: boards_select_member';
    END IF;
END $$;

-- Create a function to debug board access
CREATE OR REPLACE FUNCTION debug_board_access(user_uuid uuid)
RETURNS TABLE (
    board_id uuid,
    board_title text,
    access_type text,
    is_owner boolean,
    is_member boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as board_id,
        b.title as board_title,
        CASE 
            WHEN b.owner_id = user_uuid THEN 'owner'
            WHEN EXISTS (SELECT 1 FROM board_members bm WHERE bm.board_id = b.id AND bm.user_id = user_uuid) THEN 'member'
            ELSE 'no_access'
        END as access_type,
        (b.owner_id = user_uuid) as is_owner,
        EXISTS (SELECT 1 FROM board_members bm WHERE bm.board_id = b.id AND bm.user_id = user_uuid) as is_member
    FROM boards b
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_board_access(uuid) TO authenticated;

-- Create a simple test function to verify RLS is working
CREATE OR REPLACE FUNCTION test_board_rls()
RETURNS text AS $$
DECLARE
    current_user_id uuid := auth.uid();
    board_count integer;
    owned_count integer;
    member_count integer;
BEGIN
    -- Count total boards visible to current user
    SELECT COUNT(*) INTO board_count FROM boards;
    
    -- Count owned boards
    SELECT COUNT(*) INTO owned_count FROM boards WHERE owner_id = current_user_id;
    
    -- Count member boards
    SELECT COUNT(DISTINCT b.id) INTO member_count 
    FROM boards b 
    JOIN board_members bm ON b.id = bm.board_id 
    WHERE bm.user_id = current_user_id;
    
    RETURN format('User %s can see %s boards (%s owned, %s as member)', 
                  current_user_id, board_count, owned_count, member_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION test_board_rls() TO authenticated;