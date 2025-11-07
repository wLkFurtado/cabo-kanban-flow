-- Add cargo column to profiles and backfill from role when appropriate
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT;

-- Backfill: if cargo is empty but role has a non-default value
UPDATE public.profiles
SET cargo = role
WHERE cargo IS NULL AND role IS NOT NULL AND role <> 'user';