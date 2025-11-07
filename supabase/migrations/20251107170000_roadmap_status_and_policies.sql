-- Add status column to roadmap_suggestions and tighten RLS policies
-- Allowed statuses: 'proposed' (default), 'in_progress', 'done'

DO $$
BEGIN
  -- Add column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'roadmap_suggestions' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.roadmap_suggestions
      ADD COLUMN status text NOT NULL DEFAULT 'proposed';
  END IF;

  -- Ensure allowed values constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'roadmap_suggestions_status_chk'
  ) THEN
    ALTER TABLE public.roadmap_suggestions
      ADD CONSTRAINT roadmap_suggestions_status_chk
      CHECK (status IN ('proposed','in_progress','done'));
  END IF;

  -- Helpful index for filtering by status
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'roadmap_suggestions' AND indexname = 'idx_roadmap_suggestions_status'
  ) THEN
    CREATE INDEX idx_roadmap_suggestions_status
      ON public.roadmap_suggestions(status);
  END IF;

  -- RLS policies adjustments
  -- Insert must result in status = 'proposed' and belong to the current user
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roadmap_suggestions' AND polname = 'roadmap_suggestions_insert'
  ) THEN
    DROP POLICY roadmap_suggestions_insert ON public.roadmap_suggestions;
  END IF;

  CREATE POLICY roadmap_suggestions_insert ON public.roadmap_suggestions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND status = 'proposed');

  -- Allow owners to update their suggestion content but keep status as 'proposed'
  -- USING controls row visibility for update; WITH CHECK validates the new row
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roadmap_suggestions' AND polname = 'roadmap_suggestions_update_owner_keep_proposed'
  ) THEN
    DROP POLICY roadmap_suggestions_update_owner_keep_proposed ON public.roadmap_suggestions;
  END IF;

  CREATE POLICY roadmap_suggestions_update_owner_keep_proposed ON public.roadmap_suggestions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND status = 'proposed');

  -- Admins can update any fields including status transitions
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roadmap_suggestions' AND polname = 'roadmap_suggestions_update_admin'
  ) THEN
    DROP POLICY roadmap_suggestions_update_admin ON public.roadmap_suggestions;
  END IF;

  CREATE POLICY roadmap_suggestions_update_admin ON public.roadmap_suggestions
    FOR UPDATE
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');
END $$;

-- Note: existing select policies remain (public selectable per 20251107160000_update_roadmap_policies.sql)