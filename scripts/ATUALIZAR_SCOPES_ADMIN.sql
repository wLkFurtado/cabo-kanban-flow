-- ============================================================================
-- ATUALIZAR SCOPES DO ADMIN EXISTENTE
-- Você já é admin, só precisa adicionar os scopes corretos
-- ============================================================================

-- Atualizar scopes para o usuário admin existente
UPDATE public.user_roles
SET scopes = ARRAY['pautas_admin', 'equipments_admin']
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'wallker.furtado@gmail.com'
)
AND role = 'admin';

-- Verificar se foi atualizado
SELECT 
  ur.user_id,
  au.email,
  p.full_name,
  ur.role,
  ur.scopes
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN public.profiles p ON p.id = ur.user_id
WHERE au.email = 'wallker.furtado@gmail.com';

-- ✅ Você deve ver: role='admin' e scopes=['pautas_admin', 'equipments_admin']
-- Recarregue a página /equipamentos e tudo funcionará!
