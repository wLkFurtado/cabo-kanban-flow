-- ============================================================================
-- REMOVER REGISTRO DUPLICADO DE USER_ROLES
-- Você tem 2 registros: 'admin' e 'user'. Vamos manter apenas 'admin'
-- ============================================================================

-- Antes de deletar, veja o que será removido
SELECT 
  user_id,
  role,
  scopes,
  created_at
FROM public.user_roles
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'wallker.furtado@gmail.com'
)
ORDER BY role;

-- Deletar o registro 'user' (manter apenas 'admin')
DELETE FROM public.user_roles
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'wallker.furtado@gmail.com'
)
AND role = 'user';

-- Verificar que agora só tem 1 registro (admin)
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

-- ✅ Deve retornar apenas 1 linha com role='admin'
-- Recarregue a página /equipamentos e funcionará!
