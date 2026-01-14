-- Create weekend_teams table for storing weekend schedules
CREATE TABLE weekend_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekend_key TEXT NOT NULL UNIQUE, -- formato: YYYY-MM-DD (sábado)
  chefe UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rede UUID REFERENCES profiles(id) ON DELETE SET NULL,
  fotografo UUID REFERENCES profiles(id) ON DELETE SET NULL,
  filmmaker UUID REFERENCES profiles(id) ON DELETE SET NULL,
  edicao UUID REFERENCES profiles(id) ON DELETE SET NULL,
  designer UUID REFERENCES profiles(id) ON DELETE SET NULL,
  jornalistas UUID[] DEFAULT ARRAY[]::UUID[],
  tamoios UUID[] DEFAULT ARRAY[]::UUID[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weekend_teams ENABLE ROW LEVEL SECURITY;

-- Everyone can read weekend teams
CREATE POLICY "weekend_teams_select" ON weekend_teams
  FOR SELECT TO authenticated
  USING (true);

-- Only admins and users with escala_fds_admin scope can insert
CREATE POLICY "weekend_teams_insert" ON weekend_teams
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_current_user_role() = 'admin' OR 
    public.has_scope('escala_fds_admin')
  );

-- Only admins and users with escala_fds_admin scope can update
CREATE POLICY "weekend_teams_update" ON weekend_teams
  FOR UPDATE TO authenticated
  USING (
    public.get_current_user_role() = 'admin' OR 
    public.has_scope('escala_fds_admin')
  );

-- Only admins and users with escala_fds_admin scope can delete
CREATE POLICY "weekend_teams_delete" ON weekend_teams
  FOR DELETE TO authenticated
  USING (
    public.get_current_user_role() = 'admin' OR 
    public.has_scope('escala_fds_admin')
  );

-- Create index for fast lookups by weekend_key
CREATE INDEX idx_weekend_teams_key ON weekend_teams(weekend_key);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekend_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weekend_teams_updated_at
  BEFORE UPDATE ON weekend_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_weekend_teams_updated_at();
