-- Enable RLS on the missing tables that were flagged as security issues
-- These are the tables that showed up in the security linter

-- Check if documentsmalu table exists and enable RLS if it does
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documentsmalu') THEN
        ALTER TABLE public.documentsmalu ENABLE ROW LEVEL SECURITY;
        
        -- Create a basic policy to allow access
        DROP POLICY IF EXISTS "Allow authenticated access to documentsmalu" ON public.documentsmalu;
        CREATE POLICY "Allow authenticated access to documentsmalu"
        ON public.documentsmalu
        FOR ALL
        USING (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- Check if documentos_julia table exists and enable RLS if it does  
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documentos_julia') THEN
        ALTER TABLE public.documentos_julia ENABLE ROW LEVEL SECURITY;
        
        -- Create a basic policy to allow access
        DROP POLICY IF EXISTS "Allow authenticated access to documentos_julia" ON public.documentos_julia;
        CREATE POLICY "Allow authenticated access to documentos_julia"
        ON public.documentos_julia
        FOR ALL
        USING (auth.uid() IS NOT NULL);
    END IF;
END $$;