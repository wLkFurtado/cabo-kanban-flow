-- Create bucket for general card attachments with public read and authenticated write

DO $$
BEGIN
  -- Create bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'attachments'
  ) THEN
    -- Use positional arguments for broader compatibility
    PERFORM storage.create_bucket('attachments', true);
  END IF;

  -- Ensure bucket is public even if it already existed
  PERFORM storage.update_bucket('attachments', true);
END $$;

-- Policy: public read for attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Public read for attachments'
  ) THEN
    CREATE POLICY "Public read for attachments"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'attachments');
  END IF;
END $$;

-- Policy: authenticated users can upload to attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated upload attachments'
  ) THEN
    CREATE POLICY "Authenticated upload attachments"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'attachments' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Policy: authenticated users can update their own files in attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated update own attachments'
  ) THEN
    CREATE POLICY "Authenticated update own attachments"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'attachments' AND owner = auth.uid());
  END IF;
END $$;

-- Policy: authenticated users can delete their own files in attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated delete own attachments'
  ) THEN
    CREATE POLICY "Authenticated delete own attachments"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'attachments' AND owner = auth.uid());
  END IF;
END $$;