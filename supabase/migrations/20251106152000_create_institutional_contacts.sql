-- Create table for institutional contacts
CREATE TABLE IF NOT EXISTS public.institutional_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao TEXT NOT NULL,
  responsavel TEXT NOT NULL,
  telefone TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.institutional_contacts ENABLE ROW LEVEL SECURITY;

-- View policy: authenticated users can read
DROP POLICY IF EXISTS "Authenticated can view institutional contacts" ON public.institutional_contacts;
CREATE POLICY "Authenticated can view institutional contacts" ON public.institutional_contacts
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admin manage policy: only admins can insert/update/delete
DROP POLICY IF EXISTS "Admins can manage institutional contacts" ON public.institutional_contacts;
CREATE POLICY "Admins can manage institutional contacts" ON public.institutional_contacts
  FOR ALL USING (public.get_current_user_role() = 'admin')
  WITH CHECK (public.get_current_user_role() = 'admin');