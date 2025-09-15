-- Fix RLS recursion in board_members policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of boards they access" ON public.board_members;
DROP POLICY IF EXISTS "Board owners can manage members" ON public.board_members;

-- Create new non-recursive policies for board_members
CREATE POLICY "Users can view members of boards they own" ON public.board_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own membership" ON public.board_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Board owners can manage members" ON public.board_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND owner_id = auth.uid()
        )
    );

-- Update boards policy to be simpler and avoid recursion
DROP POLICY IF EXISTS "Users can view boards they own or are members of" ON public.boards;

CREATE POLICY "Users can view boards they own" ON public.boards
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can view boards they are members of" ON public.boards
    FOR SELECT USING (
        id IN (
            SELECT board_id FROM public.board_members 
            WHERE user_id = auth.uid()
        )
    );

-- Update board_lists policies to avoid recursion
DROP POLICY IF EXISTS "Users can view lists of accessible boards" ON public.board_lists;
DROP POLICY IF EXISTS "Board members can manage lists" ON public.board_lists;

CREATE POLICY "Users can view lists of boards they own" ON public.board_lists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view lists of boards they are members of" ON public.board_lists
    FOR SELECT USING (
        board_id IN (
            SELECT board_id FROM public.board_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Board owners can manage lists" ON public.board_lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Board members can manage lists" ON public.board_lists
    FOR INSERT WITH CHECK (
        board_id IN (
            SELECT board_id FROM public.board_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Board members can update lists" ON public.board_lists
    FOR UPDATE USING (
        board_id IN (
            SELECT board_id FROM public.board_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Board members can delete lists" ON public.board_lists
    FOR DELETE USING (
        board_id IN (
            SELECT board_id FROM public.board_members 
            WHERE user_id = auth.uid()
        )
    );

-- Update cards policies to avoid recursion
DROP POLICY IF EXISTS "Users can view cards in accessible boards" ON public.cards;
DROP POLICY IF EXISTS "Board members can manage cards" ON public.cards;

CREATE POLICY "Users can view cards in boards they own" ON public.cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.board_lists bl
            JOIN public.boards b ON bl.board_id = b.id
            WHERE bl.id = list_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view cards in boards they are members of" ON public.cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.board_lists bl
            WHERE bl.id = list_id AND bl.board_id IN (
                SELECT board_id FROM public.board_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Board owners can manage cards" ON public.cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.board_lists bl
            JOIN public.boards b ON bl.board_id = b.id
            WHERE bl.id = list_id AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Board members can manage cards" ON public.cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.board_lists bl
            WHERE bl.id = list_id AND bl.board_id IN (
                SELECT board_id FROM public.board_members 
                WHERE user_id = auth.uid()
            )
        )
    );