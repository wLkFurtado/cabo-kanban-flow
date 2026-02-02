-- ============================================================================
-- SISTEMA DE GERENCIAMENTO DE EQUIPAMENTOS
-- ============================================================================
-- Cria tabelas e políticas RLS para gerenciar equipamentos da empresa
-- com controle de empréstimos e devoluções
-- ============================================================================

-- 1. TABELA DE EQUIPAMENTOS
CREATE TABLE IF NOT EXISTS public.equipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'emprestado', 'manutencao')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE EMPRÉSTIMOS
CREATE TABLE IF NOT EXISTS public.equipment_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES public.equipments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  loaned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  returned_at TIMESTAMP WITH TIME ZONE,
  loaned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_equipments_status ON public.equipments(status);
CREATE INDEX IF NOT EXISTS idx_equipments_serial ON public.equipments(serial_number);
CREATE INDEX IF NOT EXISTS idx_equipment_loans_equipment ON public.equipment_loans(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_loans_user ON public.equipment_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_equipment_loans_active ON public.equipment_loans(equipment_id) WHERE returned_at IS NULL;

-- 4. TRIGGER PARA UPDATED_AT
CREATE TRIGGER handle_equipments_updated_at 
  BEFORE UPDATE ON public.equipments
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- 5. HABILITAR RLS
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_loans ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA EQUIPAMENTOS

-- Todos usuários autenticados podem visualizar equipamentos
CREATE POLICY "Authenticated users can view equipments" 
  ON public.equipments
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Admins e usuários com scope equipments_admin podem criar equipamentos
CREATE POLICY "Admins and equipments_admin can create equipments" 
  ON public.equipments
  FOR INSERT 
  WITH CHECK (
    public.has_scope('equipments_admin')
  );

-- Admins e usuários com scope equipments_admin podem atualizar equipamentos
CREATE POLICY "Admins and equipments_admin can update equipments" 
  ON public.equipments
  FOR UPDATE 
  USING (
    public.has_scope('equipments_admin')
  );

-- Admins e usuários com scope equipments_admin podem deletar equipamentos
CREATE POLICY "Admins and equipments_admin can delete equipments" 
  ON public.equipments
  FOR DELETE 
  USING (
    public.has_scope('equipments_admin')
  );

-- 7. POLÍTICAS RLS PARA EMPRÉSTIMOS

-- Todos usuários autenticados podem visualizar empréstimos
CREATE POLICY "Authenticated users can view loans" 
  ON public.equipment_loans
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Admins e usuários com scope equipments_admin podem criar empréstimos
CREATE POLICY "Admins and equipments_admin can create loans" 
  ON public.equipment_loans
  FOR INSERT 
  WITH CHECK (
    public.has_scope('equipments_admin')
  );

-- Admins e usuários com scope equipments_admin podem atualizar empréstimos (devoluções)
CREATE POLICY "Admins and equipments_admin can update loans" 
  ON public.equipment_loans
  FOR UPDATE 
  USING (
    public.has_scope('equipments_admin')
  );

-- 8. COMENTÁRIOS
COMMENT ON TABLE public.equipments IS 
  'Tabela de equipamentos da empresa (câmeras, microfones, etc)';

COMMENT ON TABLE public.equipment_loans IS 
  'Histórico de empréstimos de equipamentos para usuários';

COMMENT ON COLUMN public.equipments.status IS 
  'Status do equipamento: disponivel, emprestado ou manutencao';

COMMENT ON COLUMN public.equipment_loans.returned_at IS 
  'Data de devolução. NULL indica que o equipamento ainda está emprestado';
