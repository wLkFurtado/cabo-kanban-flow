-- Script de Diagnóstico: Verificar se webhook de pautas está configurado
-- Execute este script no SQL Editor do Supabase para diagnosticar problemas

-- ========================================
-- 1. VERIFICAR SE O TRIGGER EXISTE
-- ========================================
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.pautas_events'::regclass
  AND tgname = 'on_pauta_team_change';

-- Resultado esperado: 1 linha mostrando o trigger
-- Se não retornar nada: a migration não foi aplicada

-- ========================================
-- 2. VERIFICAR AS CONFIGURAÇÕES DO BANCO
-- ========================================
SELECT 
  name,
  setting 
FROM pg_settings 
WHERE name LIKE 'app.settings%';

-- Resultado esperado: 2 linhas
-- app.settings.supabase_url = https://SEU_PROJECT_ID.supabase.co
-- app.settings.supabase_anon_key = SUA_ANON_KEY
-- Se não retornar nada: variáveis não foram configuradas

-- ========================================
-- 3. VERIFICAR ÚLTIMAS PAUTAS CRIADAS/EDITADAS
-- ========================================
SELECT 
  id,
  titulo,
  data_inicio,
  filmmaker_id,
  fotografo_id,
  jornalista_id,
  rede_id,
  updated_at
FROM public.pautas_events
ORDER BY updated_at DESC
LIMIT 5;

-- Verificar se há pelo menos um dos campos de equipe preenchido
-- Se todos NULL: webhook não será disparado

-- ========================================
-- 4. VERIFICAR SE A EXTENSÃO HTTP ESTÁ HABILITADA
-- ========================================
SELECT 
  extname,
  extversion
FROM pg_extension
WHERE extname = 'http';

-- Resultado esperado: 1 linha mostrando a extensão 'http'
-- Se não retornar: a extensão não está instalada

-- ========================================
-- 5. TESTAR O TRIGGER MANUALMENTE
-- ========================================
-- Criar uma pauta de teste
INSERT INTO public.pautas_events (
  titulo,
  data_inicio,
  data_fim,
  tipo,
  prioridade,
  status,
  recorrencia,
  cor,
  criado_por,
  filmmaker_id
) VALUES (
  'TESTE WEBHOOK - DELETE DEPOIS',
  NOW(),
  NOW() + INTERVAL '1 hour',
  'evento',
  'media',
  'pendente',
  'nenhuma',
  '#3b82f6',
  auth.uid(),
  (SELECT id FROM public.profiles WHERE cargo = 'filmmaker' LIMIT 1)
)
RETURNING id, titulo, filmmaker_id;

-- Se retornar erro: há problema com RLS ou dados
-- Se funcionar: o trigger deveria ter disparado

-- ========================================
-- RESUMO DO DIAGNÓSTICO
-- ========================================
-- Execute as queries acima na ordem e verifique os resultados
-- Reporte qual query falhou para identificar o problema
