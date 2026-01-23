-- Script para diagnosticar problemas de login
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se seu usuário existe na tabela auth.users
-- Substitua 'seu@email.com' pelo seu email
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  last_sign_in_at,
  banned_until,
  deleted_at
FROM auth.users
WHERE email = 'wallker.furtado@gmail.com';

-- 2. Verificar se existe um perfil associado
SELECT 
  id,
  email,
  full_name,
  cargo,
  role,
  scopes
FROM profiles
WHERE email = 'wallker.furtado@gmail.com';

-- 3. Ver os últimos erros de autenticação (se houver)
SELECT 
  created_at,
  factor_id,
  factor_type
FROM auth.mfa_factors
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar políticas RLS da tabela profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
