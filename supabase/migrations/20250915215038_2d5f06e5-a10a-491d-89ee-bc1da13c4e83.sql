-- Fix missing RLS policies for tables that need them

-- Policies for card_members table
CREATE POLICY "Users can view card members in accessible boards" ON public.card_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cards c
            JOIN public.board_lists bl ON c.list_id = bl.id
            JOIN public.boards b ON bl.board_id = b.id
            WHERE c.id = card_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board members can manage card members" ON public.card_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cards c
            JOIN public.board_lists bl ON c.list_id = bl.id
            JOIN public.boards b ON bl.board_id = b.id
            WHERE c.id = card_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

-- Policies for card_labels table
CREATE POLICY "Users can view card labels in accessible boards" ON public.card_labels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cards c
            JOIN public.board_lists bl ON c.list_id = bl.id
            JOIN public.boards b ON bl.board_id = b.id
            WHERE c.id = card_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board members can manage card labels" ON public.card_labels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cards c
            JOIN public.board_lists bl ON c.list_id = bl.id
            JOIN public.boards b ON bl.board_id = b.id
            WHERE c.id = card_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

-- Policies for card_comments table
CREATE POLICY "Users can view comments in accessible boards" ON public.card_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cards c
            JOIN public.board_lists bl ON c.list_id = bl.id
            JOIN public.boards b ON bl.board_id = b.id
            WHERE c.id = card_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board members can manage comments" ON public.card_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cards c
            JOIN public.board_lists bl ON c.list_id = bl.id
            JOIN public.boards b ON bl.board_id = b.id
            WHERE c.id = card_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

-- Policies for custom_fields table
CREATE POLICY "Users can view custom fields of accessible boards" ON public.custom_fields
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND (
                owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = boards.id AND user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board members can manage custom fields" ON public.custom_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND (
                owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = boards.id AND user_id = auth.uid())
            )
        )
    );

-- Policies for card_custom_values table
CREATE POLICY "Users can view custom values in accessible boards" ON public.card_custom_values
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.cards c
            JOIN public.board_lists bl ON c.list_id = bl.id
            JOIN public.boards b ON bl.board_id = b.id
            WHERE c.id = card_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board members can manage custom values" ON public.card_custom_values
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.cards c
            JOIN public.board_lists bl ON c.list_id = bl.id
            JOIN public.boards b ON bl.board_id = b.id
            WHERE c.id = card_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

-- Policies for event_participants table
CREATE POLICY "Users can view event participants for accessible events" ON public.event_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = event_id AND (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM public.event_participants ep WHERE ep.event_id = events.id AND ep.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Event creators can manage participants" ON public.event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.events 
            WHERE id = event_id AND created_by = auth.uid()
        )
    );

-- Policies for pautas_participants table
CREATE POLICY "Users can view pautas participants for accessible events" ON public.pautas_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pautas_events 
            WHERE id = event_id AND (
                criado_por = auth.uid() OR
                responsavel_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.pautas_participants pp WHERE pp.event_id = pautas_events.id AND pp.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Pautas creators can manage participants" ON public.pautas_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.pautas_events 
            WHERE id = event_id AND criado_por = auth.uid()
        )
    );

-- Fix function search_path issues
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;