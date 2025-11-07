-- Create bucket for profile images (perfil) with public read and authenticated write

DO $$
BEGIN
  -- Create bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'perfil'
  ) THEN
    PERFORM storage.create_bucket('perfil', public := true);
  END IF;

  -- Ensure bucket is public even if it already existed
  PERFORM storage.update_bucket('perfil', public := true);
END $$;

-- Policy: public read for perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Public read for perfil'
  ) THEN
    CREATE POLICY "Public read for perfil"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'perfil');
  END IF;
END $$;

-- Policy: authenticated users can upload to perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated upload perfil'
  ) THEN
    CREATE POLICY "Authenticated upload perfil"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'perfil' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Policy: authenticated users can update their own files in perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated update own perfil'
  ) THEN
    CREATE POLICY "Authenticated update own perfil"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'perfil' AND owner = auth.uid());
  END IF;
END $$;

-- Policy: authenticated users can delete their own files in perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated delete own perfil'
  ) THEN
    CREATE POLICY "Authenticated delete own perfil"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'perfil' AND owner = auth.uid());
  END IF;
END $$;