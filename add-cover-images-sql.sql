-- Script SQL para adicionar o campo cover_images na tabela cards
-- Execute este script no SQL Editor do Supabase

ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS cover_images JSONB DEFAULT '[]'::jsonb;

-- Verificar se o campo foi adicionado
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'cards' AND column_name = 'cover_images';