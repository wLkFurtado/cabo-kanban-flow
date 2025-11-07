-- Test script to verify board access policies are working correctly

-- First, let's see what policies are currently active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'boards' 
ORDER BY policyname;

-- Let's also check board_members policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'board_members' 
ORDER BY policyname;

-- Test query to see what boards a specific user can access
-- Replace 'USER_ID_HERE' with an actual user ID to test
-- SELECT * FROM boards WHERE owner_id = 'USER_ID_HERE' OR id IN (
--   SELECT board_id FROM board_members WHERE user_id = 'USER_ID_HERE'
-- );