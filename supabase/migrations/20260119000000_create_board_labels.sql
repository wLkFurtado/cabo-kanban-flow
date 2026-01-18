-- Create board_labels table for pre-defined tags/labels per board
CREATE TABLE public.board_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger for board_labels
CREATE TRIGGER handle_board_labels_updated_at BEFORE UPDATE ON public.board_labels
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add optional reference to board_labels in card_labels
ALTER TABLE public.card_labels ADD COLUMN IF NOT EXISTS board_label_id UUID REFERENCES public.board_labels(id) ON DELETE SET NULL;
ALTER TABLE public.card_labels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at trigger for card_labels
CREATE TRIGGER handle_card_labels_updated_at BEFORE UPDATE ON public.card_labels
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_board_labels_board_id ON public.board_labels(board_id);
CREATE INDEX idx_card_labels_board_label_id ON public.card_labels(board_label_id);

-- Enable RLS on board_labels
ALTER TABLE public.board_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for board_labels
-- Users can view labels of boards they have access to
CREATE POLICY "Users can view labels of accessible boards" ON public.board_labels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND (
                owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = boards.id AND user_id = auth.uid())
            )
        )
    );

-- Board members can create labels
CREATE POLICY "Board members can create labels" ON public.board_labels
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND (
                owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = boards.id AND user_id = auth.uid())
            )
        )
    );

-- Board members can update labels
CREATE POLICY "Board members can update labels" ON public.board_labels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND (
                owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = boards.id AND user_id = auth.uid())
            )
        )
    );

-- Board members can delete labels
CREATE POLICY "Board members can delete labels" ON public.board_labels
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND (
                owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = boards.id AND user_id = auth.uid())
            )
        )
    );

-- Function to initialize default board labels
CREATE OR REPLACE FUNCTION public.initialize_default_board_labels()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default labels for the new board
    INSERT INTO public.board_labels (board_id, name, color) VALUES
        (NEW.id, 'IMPORTANTE', '#fca5a5'),     -- red-300
        (NEW.id, 'URGENTE', '#ef4444'),        -- red-500
        (NEW.id, 'PUBLICADO', '#22c55e'),      -- green-500
        (NEW.id, 'NÃO IMPORTANTE', '#facc15'), -- yellow-400
        (NEW.id, 'GAVETA', '#fb923c'),         -- orange-400
        (NEW.id, 'INCOMPLETO', '#a855f7'),     -- purple-500
        (NEW.id, 'NÃO URGENTE', '#3b82f6'),    -- blue-500
        (NEW.id, 'PARA FINALIZAR', '#16a34a'); -- green-600
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize default labels when a new board is created
CREATE TRIGGER initialize_board_labels_trigger
    AFTER INSERT ON public.boards
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_default_board_labels();
