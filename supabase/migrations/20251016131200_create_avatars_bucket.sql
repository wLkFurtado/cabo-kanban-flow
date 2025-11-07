-- Ensure the avatars bucket exists and allow uploads/updates/deletes by authenticated users
-- Also enable public read so getPublicUrl works as expected

DO $$
BEGIN
  -- Create bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) THEN
    PERFORM storage.create_bucket('avatars', public := true);
  END IF;
  -- Ensure bucket is public even if it already existed
  PERFORM storage.update_bucket('avatars', public := true);
END $$;

-- Policy: public read for avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Public read for avatars'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Public read for avatars"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'avatars');
    $$;
  END IF;
END $$;

-- Policy: authenticated users can upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated upload avatars'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Authenticated upload avatars"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
    $$;
  END IF;
END $$;

-- Policy: authenticated users can update own files (needed for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated update own avatars'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Authenticated update own avatars"
      ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'avatars' AND owner = auth.uid())
      WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());
    $$;
  END IF;
END $$;

-- Policy: authenticated users can delete own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated delete own avatars'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Authenticated delete own avatars"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'avatars' AND owner = auth.uid());
    $$;
  END IF;
END $$;