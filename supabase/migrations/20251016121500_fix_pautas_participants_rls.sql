-- Fix RLS recursion for pautas_participants
-- This migration replaces the SELECT policy to avoid self-referential recursion
-- and mutual recursion with pautas_events.

BEGIN;

-- Drop problematic policy that referenced pautas_participants inside itself
DROP POLICY IF EXISTS "Users can view pautas participants for accessible events" ON public.pautas_participants;

-- Recreate a non-recursive SELECT policy:
--  - Participants can view their own rows
--  - Creators/responsáveis can manage via separate policy (kept below)
CREATE POLICY "Users can view their own participant rows" ON public.pautas_participants
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Ensure manage policy exists and remains intact (does not cause recursion in normal operations)
DROP POLICY IF EXISTS "Pautas creators can manage participants" ON public.pautas_participants;
CREATE POLICY "Pautas creators can manage participants" ON public.pautas_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pautas_events 
      WHERE id = event_id AND criado_por = auth.uid()
    )
  );

COMMIT;