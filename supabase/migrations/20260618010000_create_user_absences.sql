-- Create user_absences table
CREATE TABLE IF NOT EXISTS public.user_absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ferias', 'folga')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_dates CHECK (data_inicio <= data_fim)
);

-- Enable RLS
ALTER TABLE public.user_absences ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read absences (to prevent scheduling unavailable people)
CREATE POLICY "user_absences_select" ON public.user_absences
  FOR SELECT TO authenticated
  USING (true);

-- Admins and users with pautas_admin scope can modify absences
CREATE POLICY "user_absences_insert" ON public.user_absences
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_current_user_role() = 'admin' OR 
    public.has_scope('pautas_admin')
  );

CREATE POLICY "user_absences_update" ON public.user_absences
  FOR UPDATE TO authenticated
  USING (
    public.get_current_user_role() = 'admin' OR 
    public.has_scope('pautas_admin')
  );

CREATE POLICY "user_absences_delete" ON public.user_absences
  FOR DELETE TO authenticated
  USING (
    public.get_current_user_role() = 'admin' OR 
    public.has_scope('pautas_admin')
  );

-- Create indices for fast range queries and user queries
CREATE INDEX IF NOT EXISTS idx_user_absences_dates ON public.user_absences(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_user_absences_user ON public.user_absences(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_absences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_absences_updated_at
  BEFORE UPDATE ON public.user_absences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_absences_updated_at();
