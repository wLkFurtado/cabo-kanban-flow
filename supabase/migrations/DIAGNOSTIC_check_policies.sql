-- DIAGNÓSTICO: Execute esta query no Supabase SQL Editor para ver TODAS as políticas ativas
-- Isso nos mostrará exatamente o que está causando o problema

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
WHERE tablename = 'board_members'
ORDER BY policyname;
