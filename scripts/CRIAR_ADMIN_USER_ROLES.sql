-- ============================================================================
-- CRIAR ENTRADA ADMIN NA TABELA USER_ROLES (VERSÃO SIMPLIFICADA)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================================

-- Substitua 'wallker.furtado@gmail.com' pelo seu email se necessário

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'wallker.furtado@gmail.com'; -- ⚠️ AJUSTE SE NECESSÁRIO
  v_exists BOOLEAN;
BEGIN
  -- Buscar o UUID do usuário pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado.', v_email;
  END IF;
  
  -- Verificar se já existe entrada
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles WHERE user_id = v_user_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Atualizar existente
    UPDATE public.user_roles
    SET role = 'admin',
        scopes = ARRAY['pautas_admin', 'equipments_admin']
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Usuário % atualizado para admin!', v_email;
  ELSE
    -- Criar novo
    INSERT INTO public.user_roles (user_id, role, scopes)
    VALUES (v_user_id, 'admin', ARRAY['pautas_admin', 'equipments_admin']);
    
    RAISE NOTICE 'Usuário % configurado como admin!', v_email;
  END IF;
END $$;


-- Verificar se foi criado/atualizado corretamente
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

-- ✅ Se você ver seu email com role='admin', está pronto!
-- Recarregue a página /equipamentos e tudo funcionará!
