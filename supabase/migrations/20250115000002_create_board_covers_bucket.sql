-- Create bucket for board cover images
-- This bucket will store cover images for boards with proper access policies

DO $$
BEGIN
  -- Create bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'board-covers'
  ) THEN
    PERFORM storage.create_bucket('board-covers', public := true);
  END IF;
  
  -- Ensure bucket is public even if it already existed
  PERFORM storage.update_bucket('board-covers', public := true);
END $$;

-- Policy: public read for board covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Public read for board covers'
  ) THEN
    CREATE POLICY "Public read for board covers"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'board-covers');
  END IF;
END $$;

-- Policy: authenticated users can upload board covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated upload board covers'
  ) THEN
    CREATE POLICY "Authenticated upload board covers"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'board-covers' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Policy: authenticated users can update their own board covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated update own board covers'
  ) THEN
    CREATE POLICY "Authenticated update own board covers"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'board-covers' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'board-covers' AND owner = auth.uid());
  END IF;
END $$;

-- Policy: authenticated users can delete their own board covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated delete own board covers'
  ) THEN
    CREATE POLICY "Authenticated delete own board covers"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'board-covers' AND owner = auth.uid());
  END IF;
END $$;