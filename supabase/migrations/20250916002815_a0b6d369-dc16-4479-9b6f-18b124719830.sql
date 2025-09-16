-- Fix infinite recursion in boards RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view boards they are members of" ON public.boards;
DROP POLICY IF EXISTS "Users can view boards they own" ON public.boards;
DROP POLICY IF EXISTS "Board owners can update their boards" ON public.boards;
DROP POLICY IF EXISTS "Board owners can delete their boards" ON public.boards;
DROP POLICY IF EXISTS "Users can create their own boards" ON public.boards;

-- Create simple, non-recursive policies for boards
CREATE POLICY "Users can view their own boards" 
ON public.boards 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Users can view boards where they are members" 
ON public.boards 
FOR SELECT 
USING (id IN (
  SELECT board_id 
  FROM public.board_members 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create boards" 
ON public.boards 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Board owners can update boards" 
ON public.boards 
FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Board owners can delete boards" 
ON public.boards 
FOR DELETE 
USING (owner_id = auth.uid());

-- Fix board_lists policies to avoid recursion
DROP POLICY IF EXISTS "Users can view lists of boards they are members of" ON public.board_lists;
DROP POLICY IF EXISTS "Users can view lists of boards they own" ON public.board_lists;
DROP POLICY IF EXISTS "Board members can manage lists" ON public.board_lists;
DROP POLICY IF EXISTS "Board members can update lists" ON public.board_lists;
DROP POLICY IF EXISTS "Board members can delete lists" ON public.board_lists;
DROP POLICY IF EXISTS "Board owners can manage lists" ON public.board_lists;

-- Create simple board_lists policies
CREATE POLICY "Users can view lists of owned boards" 
ON public.board_lists 
FOR SELECT 
USING (board_id IN (
  SELECT id FROM public.boards WHERE owner_id = auth.uid()
));

CREATE POLICY "Users can view lists of member boards" 
ON public.board_lists 
FOR SELECT 
USING (board_id IN (
  SELECT board_id FROM public.board_members WHERE user_id = auth.uid()
));

CREATE POLICY "Board owners can manage lists" 
ON public.board_lists 
FOR ALL 
USING (board_id IN (
  SELECT id FROM public.boards WHERE owner_id = auth.uid()
));

CREATE POLICY "Board members can manage lists" 
ON public.board_lists 
FOR ALL 
USING (board_id IN (
  SELECT board_id FROM public.board_members WHERE user_id = auth.uid()
));

-- Fix cards policies to avoid recursion
DROP POLICY IF EXISTS "Users can view cards in boards they are members of" ON public.cards;
DROP POLICY IF EXISTS "Users can view cards in boards they own" ON public.cards;
DROP POLICY IF EXISTS "Board members can manage cards" ON public.cards;
DROP POLICY IF EXISTS "Board owners can manage cards" ON public.cards;

-- Create simple cards policies
CREATE POLICY "Users can view cards in owned boards" 
ON public.cards 
FOR SELECT 
USING (list_id IN (
  SELECT bl.id FROM public.board_lists bl
  JOIN public.boards b ON bl.board_id = b.id
  WHERE b.owner_id = auth.uid()
));

CREATE POLICY "Users can view cards in member boards" 
ON public.cards 
FOR SELECT 
USING (list_id IN (
  SELECT bl.id FROM public.board_lists bl
  WHERE bl.board_id IN (
    SELECT board_id FROM public.board_members WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Board owners can manage cards" 
ON public.cards 
FOR ALL 
USING (list_id IN (
  SELECT bl.id FROM public.board_lists bl
  JOIN public.boards b ON bl.board_id = b.id
  WHERE b.owner_id = auth.uid()
));

CREATE POLICY "Board members can manage cards" 
ON public.cards 
FOR ALL 
USING (list_id IN (
  SELECT bl.id FROM public.board_lists bl
  WHERE bl.board_id IN (
    SELECT board_id FROM public.board_members WHERE user_id = auth.uid()
  )
));