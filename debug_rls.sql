-- Debug script to check RLS policies and board access
-- Run this in Supabase SQL Editor

-- Check current RLS policies for boards table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'boards';

-- Check current RLS policies for board_members table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'board_members';

-- Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename IN ('boards', 'board_members');

-- Test board access for current user (replace with actual user ID)
-- This will show what boards are visible to the current user
SELECT 
  b.id,
  b.title,
  b.owner_id,
  CASE 
    WHEN b.owner_id = auth.uid() THEN 'owner'
    WHEN EXISTS (SELECT 1 FROM board_members bm WHERE bm.board_id = b.id AND bm.user_id = auth.uid()) THEN 'member'
    ELSE 'no_access'
  END as access_type
FROM boards b;

-- Check board memberships for current user
SELECT 
  bm.board_id,
  bm.user_id,
  b.title as board_title,
  b.owner_id
FROM board_members bm
JOIN boards b ON b.id = bm.board_id
WHERE bm.user_id = auth.uid();