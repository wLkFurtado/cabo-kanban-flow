-- Script para criar contatos de teste
-- Execute este script no Supabase Dashboard > SQL Editor

-- Inserir perfis de teste na tabela profiles
INSERT INTO public.profiles (id, full_name, display_name, email, phone, cargo) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Ana Silva Santos', 'Ana Silva', 'ana.silva@coordcom.gov.br', '(11) 98765-4321', 'Coordenadora de Comunicação'),
('550e8400-e29b-41d4-a716-446655440002', 'Carlos Eduardo Oliveira', 'Carlos Eduardo', 'carlos.oliveira@coordcom.gov.br', '(11) 97654-3210', 'Analista de Comunicação'),
('550e8400-e29b-41d4-a716-446655440003', 'Maria Fernanda Costa', 'Maria Fernanda', 'maria.costa@coordcom.gov.br', '(11) 96543-2109', 'Designer Gráfico'),
('550e8400-e29b-41d4-a716-446655440004', 'João Pedro Almeida', 'João Pedro', 'joao.almeida@coordcom.gov.br', '(11) 95432-1098', 'Jornalista'),
('550e8400-e29b-41d4-a716-446655440005', 'Beatriz Rodrigues Lima', 'Beatriz Rodrigues', 'beatriz.lima@coordcom.gov.br', '(11) 94321-0987', 'Social Media'),
('550e8400-e29b-41d4-a716-446655440006', 'Rafael Santos Pereira', 'Rafael Santos', 'rafael.pereira@coordcom.gov.br', '(11) 93210-9876', 'Fotógrafo'),
('550e8400-e29b-41d4-a716-446655440007', 'Camila Ferreira Souza', 'Camila Ferreira', 'camila.souza@coordcom.gov.br', '(11) 92109-8765', 'Assessora de Imprensa'),
('550e8400-e29b-41d4-a716-446655440008', 'Lucas Martins Silva', 'Lucas Martins', 'lucas.silva@coordcom.gov.br', '(11) 91098-7654', 'Editor de Vídeo'),
('550e8400-e29b-41d4-a716-446655440009', 'Juliana Barbosa Santos', 'Juliana Barbosa', 'juliana.santos@coordcom.gov.br', '(11) 90987-6543', 'Produtora de Conteúdo'),
('550e8400-e29b-41d4-a716-446655440010', 'Pedro Henrique Costa', 'Pedro Henrique', 'pedro.costa@coordcom.gov.br', '(11) 89876-5432', 'Estagiário')
ON CONFLICT (id) DO NOTHING;

-- Inserir roles correspondentes na tabela user_roles
INSERT INTO public.user_roles (user_id, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin'),
('550e8400-e29b-41d4-a716-446655440002', 'user'),
('550e8400-e29b-41d4-a716-446655440003', 'user'),
('550e8400-e29b-41d4-a716-446655440004', 'user'),
('550e8400-e29b-41d4-a716-446655440005', 'user'),
('550e8400-e29b-41d4-a716-446655440006', 'user'),
('550e8400-e29b-41d4-a716-446655440007', 'user'),
('550e8400-e29b-41d4-a716-446655440008', 'user'),
('550e8400-e29b-41d4-a716-446655440009', 'user'),
('550e8400-e29b-41d4-a716-446655440010', 'guest')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar se os dados foram inseridos corretamente
SELECT 
  p.full_name,
  p.email,
  p.cargo,
  ur.role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE p.id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440008',
  '550e8400-e29b-41d4-a716-446655440009',
  '550e8400-e29b-41d4-a716-446655440010'
)
ORDER BY p.full_name;