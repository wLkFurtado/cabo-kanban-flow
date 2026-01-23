-- ============================================================================
-- SCRIPT PARA ANALISAR E REDUZIR USO DE STORAGE NO SUPABASE
-- ============================================================================

-- 1. Ver uso total por bucket
SELECT 
  bucket_id, 
  COUNT(*) as total_files,
  SUM((metadata->>'size')::bigint) as total_bytes,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as size_formatted
FROM storage.objects
GROUP BY bucket_id
ORDER BY total_bytes DESC;

-- 2. Ver os maiores arquivos em cada bucket
SELECT 
  bucket_id,
  name,
  (metadata->>'size')::bigint as size_bytes,
  pg_size_pretty((metadata->>'size')::bigint) as size_formatted,
  created_at
FROM storage.objects
WHERE (metadata->>'size')::bigint > 1000000  -- Arquivos maiores que 1MB
ORDER BY size_bytes DESC
LIMIT 50;

-- 3. Ver quantos arquivos por tipo (extensão)
SELECT 
  bucket_id,
  SUBSTRING(name FROM '\.([^.]+)$') as extension,
  COUNT(*) as count,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id, extension
ORDER BY SUM((metadata->>'size')::bigint) DESC;

-- 4. Ver arquivos duplicados ou não utilizados
-- (cards covers que não têm card associado)
SELECT 
  o.name,
  o.bucket_id,
  pg_size_pretty((o.metadata->>'size')::bigint) as size,
  o.created_at
FROM storage.objects o
WHERE o.bucket_id = 'card-covers'
  AND NOT EXISTS (
    SELECT 1 FROM cards c 
    WHERE c.cover_image = o.name
  )
ORDER BY (o.metadata->>'size')::bigint DESC;

-- 5. Ver attachments órfãos (sem card associado)
SELECT 
  o.name,
  o.bucket_id,
  pg_size_pretty((o.metadata->>'size')::bigint) as size,
  o.created_at
FROM storage.objects o
WHERE o.bucket_id = 'attachments'
  AND NOT EXISTS (
    SELECT 1 FROM card_attachments ca 
    WHERE ca.file_path = o.name
  )
ORDER BY (o.metadata->>'size')::bigint DESC;

-- ============================================================================
-- LIMPEZA (CUIDADO! Execute apenas após confirmar os dados acima)
-- ============================================================================

-- 6. DELETAR card covers órfãos (DESCOMENTE PARA EXECUTAR)
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'card-covers'
--   AND NOT EXISTS (
--     SELECT 1 FROM cards c 
--     WHERE c.cover_image = name
--   );

-- 7. DELETAR attachments órfãos (DESCOMENTE PARA EXECUTAR)
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'attachments'
--   AND NOT EXISTS (
--     SELECT 1 FROM card_attachments ca 
--     WHERE ca.file_path = name
--   );

-- 8. DELETAR avatares órfãos (DESCOMENTE PARA EXECUTAR)
-- DELETE FROM storage.objects
-- WHERE bucket_id = 'avatars'
--   AND NOT EXISTS (
--     SELECT 1 FROM profiles p 
--     WHERE p.avatar_url LIKE '%' || name
--   );
