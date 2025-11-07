-- Add cover image and cover color fields to boards table
-- This allows boards to have custom cover images or background colors

-- Add cover_image_url column for storing image URLs from storage
ALTER TABLE boards 
ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Add cover_color column for storing background colors when no image is used
ALTER TABLE boards 
ADD COLUMN IF NOT EXISTS cover_color text;

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN boards.cover_image_url IS 'URL to cover image stored in Supabase storage';
COMMENT ON COLUMN boards.cover_color IS 'Hex color code for board cover when no image is used';