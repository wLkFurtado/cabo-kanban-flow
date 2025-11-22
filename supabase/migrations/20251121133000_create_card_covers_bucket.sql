-- Create bucket for card cover images with public read and authenticated write

DO $$
BEGIN
  -- Create bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'card-covers'
  ) THEN
    -- Use positional arguments for broader compatibility
    PERFORM storage.create_bucket('card-covers', true);
  END IF;

  -- Ensure bucket is public even if it already existed
  PERFORM storage.update_bucket('card-covers', true);
END $$;

-- Policy: public read for card-covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Public read for card-covers'
  ) THEN
    CREATE POLICY "Public read for card-covers"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'card-covers');
  END IF;
END $$;

-- Policy: authenticated users can upload to card-covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated upload card-covers'
  ) THEN
    CREATE POLICY "Authenticated upload card-covers"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'card-covers' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Policy: authenticated users can update their own files in card-covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated update own card-covers'
  ) THEN
    CREATE POLICY "Authenticated update own card-covers"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'card-covers' AND owner = auth.uid());
  END IF;
END $$;

-- Policy: authenticated users can delete their own files in card-covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated delete own card-covers'
  ) THEN
    CREATE POLICY "Authenticated delete own card-covers"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'card-covers' AND owner = auth.uid());
  END IF;
END $$;