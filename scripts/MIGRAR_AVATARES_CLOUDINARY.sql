-- ============================================================================
-- SCRIPT PARA MIGRAR AVATARES DO SUPABASE PARA CLOUDINARY
-- ============================================================================

-- 1. Listar todos os avatares atuais
SELECT 
  id,
  full_name,
  email,
  avatar_url,
  CASE 
    WHEN avatar_url IS NULL THEN 'SEM_AVATAR'
    WHEN avatar_url LIKE '%supabase%' THEN 'SUPABASE'
    WHEN avatar_url LIKE '%cloudinary%' THEN 'CLOUDINARY'
    ELSE 'OTHER'
  END as source,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- 2. Contar avatares por fonte
SELECT 
  CASE 
    WHEN avatar_url IS NULL THEN 'SEM_AVATAR'
    WHEN avatar_url LIKE '%supabase%' THEN 'SUPABASE'
    WHEN avatar_url LIKE '%cloudinary%' THEN 'CLOUDINARY'
    ELSE 'OTHER'
  END as source,
  COUNT(*) as total
FROM profiles
GROUP BY source;

-- 3. Listar apenas avatares do Supabase que precisam ser migrados
SELECT 
  id,
  full_name,
  email,
  avatar_url
FROM profiles
WHERE avatar_url LIKE '%supabase%'
ORDER BY full_name;

-- ============================================================================
-- APÓS MIGRAR MANUALMENTE OS AVATARES PARA CLOUDINARY
-- ============================================================================

-- 4. Atualizar URL de um avatar específico
-- EXEMPLO (NÃO EXECUTAR DIRETAMENTE):
-- UPDATE profiles 
-- SET avatar_url = 'https://res.cloudinary.com/dhsgmhaak/image/upload/v1234567890/avatars/user_id.jpg'
-- WHERE id = 'user-uuid-aqui';

-- 5. Verificar se todos os avatares foram migrados
SELECT 
  COUNT(*) FILTER (WHERE avatar_url LIKE '%supabase%') as supabase_count,
  COUNT(*) FILTER (WHERE avatar_url LIKE '%cloudinary%') as cloudinary_count,
  COUNT(*) FILTER (WHERE avatar_url IS NULL) as sem_avatar_count
FROM profiles;
