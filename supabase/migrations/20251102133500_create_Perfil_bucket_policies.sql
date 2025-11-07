-- Ensure bucket "Perfil" exists and has proper RLS policies

DO $$
BEGIN
  -- Create bucket if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'Perfil'
  ) THEN
    PERFORM storage.create_bucket('Perfil', public := true);
  END IF;

  -- Ensure bucket is public even if it already existed
  PERFORM storage.update_bucket('Perfil', public := true);
END $$;

-- Policy: public read for Perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Public read for Perfil'
  ) THEN
    CREATE POLICY "Public read for Perfil"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'Perfil');
  END IF;
END $$;

-- Policy: authenticated users can upload to Perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated upload Perfil'
  ) THEN
    CREATE POLICY "Authenticated upload Perfil"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'Perfil' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Policy: authenticated users can update their own files in Perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated update own Perfil'
  ) THEN
    CREATE POLICY "Authenticated update own Perfil"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'Perfil' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'Perfil' AND owner = auth.uid());
  END IF;
END $$;

-- Policy: authenticated users can delete their own files in Perfil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'Authenticated delete own Perfil'
  ) THEN
    CREATE POLICY "Authenticated delete own Perfil"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'Perfil' AND owner = auth.uid());
  END IF;
END $$;