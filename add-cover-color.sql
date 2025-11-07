-- Add cover_color column to cards table
ALTER TABLE public.cards ADD COLUMN cover_color text;

-- Add comment to document the column
COMMENT ON COLUMN public.cards.cover_color IS 'Color for card cover (green, yellow, orange, red, purple, blue)';