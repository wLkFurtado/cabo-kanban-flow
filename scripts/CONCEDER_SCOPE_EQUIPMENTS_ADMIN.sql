-- ============================================================================
-- CONCEDER SCOPE EQUIPMENTS_ADMIN A UM USUÁRIO
-- ============================================================================

-- PASSO 1: Listar todos os usuários disponíveis para escolher o email correto
SELECT 
  au.id,
  au.email,
  p.full_name,
  ur.role,
  ur.scopes
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN user_roles ur ON ur.user_id = au.id
ORDER BY au.email;

-- PASSO 2: Substituir 'SEU-EMAIL-AQUI' pelo email do usuário da lista acima
-- e executar este bloco:

DO $$
DECLARE
  target_user_id UUID;
  target_email TEXT := 'SEU-EMAIL-AQUI'; -- <<<< SUBSTITUA AQUI
BEGIN
  -- Buscar o ID do usuário
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  -- Validar se o usuário existe
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado!', target_email;
  END IF;

  -- Inserir ou atualizar o scope
  INSERT INTO user_roles (user_id, role, scopes)
  VALUES (target_user_id, 'user', ARRAY['equipments_admin'])
  ON CONFLICT (user_id, role) DO UPDATE
  SET scopes = array_append(user_roles.scopes, 'equipments_admin')
  WHERE NOT ('equipments_admin' = ANY(user_roles.scopes));

  RAISE NOTICE 'Scope equipments_admin concedido com sucesso para %!', target_email;
END $$;

-- PASSO 3: Verificar se foi concedido corretamente
SELECT 
  au.email,
  p.full_name,
  ur.role,
  ur.scopes,
  CASE 
    WHEN 'equipments_admin' = ANY(ur.scopes) THEN '✓ TEM PERMISSÃO'
    ELSE '✗ SEM PERMISSÃO'
  END as status_equipments
FROM auth.users au
JOIN profiles p ON p.id = au.id
LEFT JOIN user_roles ur ON ur.user_id = au.id
WHERE au.email = 'SEU-EMAIL-AQUI' -- <<<< SUBSTITUA AQUI TAMBÉM
ORDER BY au.email;
