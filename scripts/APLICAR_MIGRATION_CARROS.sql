-- ============================================================================
-- APLICAR MIGRATION DE CARROS
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================

-- 1. CRIAR TABELA DE CARROS
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  plate TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'emprestado', 'manutencao')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA DE EMPRÉSTIMOS DE CARROS
CREATE TABLE IF NOT EXISTS public.vehicle_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  loaned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  returned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  km_inicial INTEGER NOT NULL,
  km_final INTEGER,
  loaned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  returned_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_loans_vehicle ON public.vehicle_loans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_loans_user ON public.vehicle_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_loans_active ON public.vehicle_loans(vehicle_id) WHERE returned_at IS NULL;

-- 4. CRIAR TRIGGER
CREATE TRIGGER handle_vehicles_updated_at 
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. HABILITAR RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_loans ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS RLS PARA CARROS
CREATE POLICY "Authenticated users can view vehicles" 
  ON public.vehicles
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and vehicles_admin can create vehicles" 
  ON public.vehicles
  FOR INSERT 
  WITH CHECK (public.has_scope('vehicles_admin'));

CREATE POLICY "Admins and vehicles_admin can update vehicles" 
  ON public.vehicles
  FOR UPDATE 
  USING (public.has_scope('vehicles_admin'));

CREATE POLICY "Admins and vehicles_admin can delete vehicles" 
  ON public.vehicles
  FOR DELETE 
  USING (public.has_scope('vehicles_admin'));

-- 7. CRIAR POLÍTICAS RLS PARA EMPRÉSTIMOS
CREATE POLICY "Authenticated users can view vehicle loans" 
  ON public.vehicle_loans
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and vehicles_admin can create vehicle loans" 
  ON public.vehicle_loans
  FOR INSERT 
  WITH CHECK (public.has_scope('vehicles_admin'));

CREATE POLICY "Admins and vehicles_admin can update vehicle loans" 
  ON public.vehicle_loans
  FOR UPDATE 
  USING (public.has_scope('vehicles_admin'));
