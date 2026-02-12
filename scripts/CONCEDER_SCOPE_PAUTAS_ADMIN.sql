-- Script para conceder o scope 'pautas_admin' a um usuário específico
-- Isso permite que o usuário possa excluir pautas

-- IMPORTANTE: Substitua o email abaixo pelo email do usuário que deve ter permissão

-- Para o usuário principal (wallker)
UPDATE auth.users
SET raw_app_meta_data = 
  CASE 
    WHEN raw_app_meta_data ? 'scopes' THEN
      jsonb_set(
        raw_app_meta_data,
        '{scopes}',
        (raw_app_meta_data->'scopes')::jsonb || '["pautas_admin"]'::jsonb
      )
    ELSE
      raw_app_meta_data || '{"scopes": ["pautas_admin"]}'::jsonb
  END
WHERE email = 'wallkerfurtado@gmail.com';

-- Verificar se foi aplicado corretamente
SELECT 
  email,
  raw_app_meta_data->'scopes' as scopes,
  role
FROM auth.users
WHERE email = 'wallkerfurtado@gmail.com';

-- Para adicionar a outros usuários, copie e modifique o bloco acima:
/*
UPDATE auth.users
SET raw_app_meta_data = 
  CASE 
    WHEN raw_app_meta_data ? 'scopes' THEN
      jsonb_set(
        raw_app_meta_data,
        '{scopes}',
        (raw_app_meta_data->'scopes')::jsonb || '["pautas_admin"]'::jsonb
      )
    ELSE
      raw_app_meta_data || '{"scopes": ["pautas_admin"]}'::jsonb
  END
WHERE email = 'outro@email.com';
*/
