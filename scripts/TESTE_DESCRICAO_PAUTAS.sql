-- Script para testar se o campo descricao está funcionando
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a coluna descricao existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pautas_events' 
AND column_name = 'descricao';

-- 2. Ver pautas existentes e suas descrições
SELECT 
  id,
  titulo,
  descricao,
  data_inicio,
  created_at,
  updated_at
FROM pautas_events
ORDER BY created_at DESC
LIMIT 10;

-- 3. Testar UPDATE manualmente (substitua o ID por um ID real)
-- UPDATE pautas_events
-- SET descricao = 'Teste de descrição manual'
-- WHERE id = 'SEU-ID-AQUI';

-- 4. Verificar o resultado
-- SELECT id, titulo, descricao FROM pautas_events WHERE id = 'SEU-ID-AQUI';
