-- ============================================================================
-- SISTEMA DE GERENCIAMENTO DE CARROS
-- ============================================================================
-- Cria tabelas e políticas RLS para gerenciar carros da empresa
-- com controle de empréstimos e rastreamento de quilometragem
-- ============================================================================

-- 1. TABELA DE CARROS
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

-- 2. TABELA DE EMPRÉSTIMOS DE CARROS
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

-- 3. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_loans_vehicle ON public.vehicle_loans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_loans_user ON public.vehicle_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_loans_active ON public.vehicle_loans(vehicle_id) WHERE returned_at IS NULL;

-- 4. TRIGGER PARA UPDATED_AT
CREATE TRIGGER handle_vehicles_updated_at 
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. HABILITAR RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_loans ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA CARROS

-- Todos usuários autenticados podem visualizar carros
CREATE POLICY "Authenticated users can view vehicles" 
  ON public.vehicles
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Admins e usuários com scope vehicles_admin podem criar carros
CREATE POLICY "Admins and vehicles_admin can create vehicles" 
  ON public.vehicles
  FOR INSERT 
  WITH CHECK (
    public.has_scope('vehicles_admin')
  );

-- Admins e usuários com scope vehicles_admin podem atualizar carros
CREATE POLICY "Admins and vehicles_admin can update vehicles" 
  ON public.vehicles
  FOR UPDATE 
  USING (
    public.has_scope('vehicles_admin')
  );

-- Admins e usuários com scope vehicles_admin podem deletar carros
CREATE POLICY "Admins and vehicles_admin can delete vehicles" 
  ON public.vehicles
  FOR DELETE 
  USING (
    public.has_scope('vehicles_admin')
  );

-- 7. POLÍTICAS RLS PARA EMPRÉSTIMOS DE CARROS

-- Todos usuários autenticados podem visualizar empréstimos
CREATE POLICY "Authenticated users can view vehicle loans" 
  ON public.vehicle_loans
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Admins e usuários com scope vehicles_admin podem criar empréstimos
CREATE POLICY "Admins and vehicles_admin can create vehicle loans" 
  ON public.vehicle_loans
  FOR INSERT 
  WITH CHECK (
    public.has_scope('vehicles_admin')
  );

-- Admins e usuários com scope vehicles_admin podem atualizar empréstimos (devoluções)
CREATE POLICY "Admins and vehicles_admin can update vehicle loans" 
  ON public.vehicle_loans
  FOR UPDATE 
  USING (
    public.has_scope('vehicles_admin')
  );

-- 8. COMENTÁRIOS
COMMENT ON TABLE public.vehicles IS 
  'Tabela de carros da empresa';

COMMENT ON TABLE public.vehicle_loans IS 
  'Histórico de empréstimos de carros com rastreamento de quilometragem';

COMMENT ON COLUMN public.vehicles.status IS 
  'Status do carro: disponivel, emprestado ou manutencao';

COMMENT ON COLUMN public.vehicle_loans.km_inicial IS 
  'Quilometragem quando o carro foi emprestado';

COMMENT ON COLUMN public.vehicle_loans.km_final IS 
  'Quilometragem quando o carro foi devolvido. NULL indica que ainda está emprestado';

COMMENT ON COLUMN public.vehicle_loans.returned_at IS 
  'Data de devolução. NULL indica que o carro ainda está emprestado';
