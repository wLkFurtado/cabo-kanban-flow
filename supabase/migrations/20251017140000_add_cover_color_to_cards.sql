-- Add cover_color column to cards to support Kanban cover color persistence
-- Safe to run multiple times due to IF NOT EXISTS

BEGIN;

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS cover_color text;

COMMIT;