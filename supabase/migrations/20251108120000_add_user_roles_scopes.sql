-- Add scoped permissions to user_roles and helper function

BEGIN;

-- Add scopes column to user_roles (array of text scopes)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Helper: check if current user has a given scope or is admin
CREATE OR REPLACE FUNCTION public.has_scope(scope TEXT)
RETURNS BOOLEAN AS $$
  SELECT
    public.get_current_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.scopes @> ARRAY[scope]
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Allow admins or pautas_admin scoped users to manage pautas_events
DROP POLICY IF EXISTS "Event creators can update their pautas events" ON public.pautas_events;
DROP POLICY IF EXISTS "Event creators can delete their pautas events" ON public.pautas_events;
DROP POLICY IF EXISTS "Users can create pautas events" ON public.pautas_events;

CREATE POLICY "Create pautas: creator or admin scope" ON public.pautas_events
  FOR INSERT WITH CHECK (
    criado_por = auth.uid() OR public.has_scope('pautas_admin')
  );

CREATE POLICY "Update pautas: creator or admin scope" ON public.pautas_events
  FOR UPDATE USING (
    criado_por = auth.uid() OR public.has_scope('pautas_admin')
  );

CREATE POLICY "Delete pautas: creator or admin scope" ON public.pautas_events
  FOR DELETE USING (
    criado_por = auth.uid() OR public.has_scope('pautas_admin')
  );

COMMIT;