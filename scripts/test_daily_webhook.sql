-- ============================================================================
-- SCRIPT DE TESTE DO WEBHOOK DIÁRIO DE PAUTAS
-- ============================================================================
-- Este script permite testar e visualizar o payload que será enviado
-- ============================================================================

-- 1️⃣ VER QUAIS PAUTAS SERÃO ENVIADAS AMANHÃ
-- ============================================================================
SELECT 
  id,
  titulo AS nome_pauta,
  data_inicio,
  filmmaker_id,
  fotografo_id,
  jornalista_id,
  rede_id,
  CASE 
    WHEN filmmaker_id IS NOT NULL OR fotografo_id IS NOT NULL 
      OR jornalista_id IS NOT NULL OR rede_id IS NOT NULL 
    THEN '✅ Tem equipe'
    ELSE '⚠️ Sem equipe'
  END AS status_equipe
FROM public.pautas_events
WHERE data_inicio >= (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/Sao_Paulo'
  AND data_inicio < (CURRENT_DATE + INTERVAL '2 days') AT TIME ZONE 'America/Sao_Paulo'
ORDER BY data_inicio;

-- 2️⃣ VISUALIZAR O PAYLOAD COMPLETO QUE SERÁ ENVIADO
-- ============================================================================
-- Este query mostra EXATAMENTE o JSON que será enviado no webhook
WITH pautas_tomorrow AS (
  SELECT 
    pe.id,
    pe.titulo,
    pe.data_inicio,
    pe.filmmaker_id,
    pe.fotografo_id,
    pe.jornalista_id,
    pe.rede_id
  FROM public.pautas_events pe
  WHERE pe.data_inicio >= (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/Sao_Paulo'
    AND pe.data_inicio < (CURRENT_DATE + INTERVAL '2 days') AT TIME ZONE 'America/Sao_Paulo'
),
pautas_with_team AS (
  SELECT 
    pt.id,
    pt.titulo,
    pt.data_inicio,
    jsonb_agg(
      jsonb_build_object(
        'funcao', team_member.funcao,
        'nome', COALESCE(team_member.full_name, 'Nome não disponível'),
        'telefone', team_member.phone
      )
    ) FILTER (WHERE team_member.funcao IS NOT NULL) AS equipe
  FROM pautas_tomorrow pt
  LEFT JOIN LATERAL (
    -- Filmmaker
    SELECT 'Filmmaker' AS funcao, p.full_name, p.phone
    FROM public.profiles p
    WHERE p.id = pt.filmmaker_id
    
    UNION ALL
    
    -- Fotógrafo
    SELECT 'Fotógrafo' AS funcao, p.full_name, p.phone
    FROM public.profiles p
    WHERE p.id = pt.fotografo_id
    
    UNION ALL
    
    -- Jornalista
    SELECT 'Jornalista' AS funcao, p.full_name, p.phone
    FROM public.profiles p
    WHERE p.id = pt.jornalista_id
    
    UNION ALL
    
    -- Rede
    SELECT 'Rede' AS funcao, p.full_name, p.phone
    FROM public.profiles p
    WHERE p.id = pt.rede_id
  ) team_member ON true
  GROUP BY pt.id, pt.titulo, pt.data_inicio
)
SELECT jsonb_pretty(
  jsonb_build_object(
    'tipo', 'resumo_diario',
    'data_pautas', (CURRENT_DATE + INTERVAL '1 day')::date,
    'total', COUNT(*),
    'pautas', jsonb_agg(
      jsonb_build_object(
        'id', pw.id,
        'nome_pauta', COALESCE(pw.titulo, 'Evento'),
        'data', pw.data_inicio,
        'equipe', COALESCE(pw.equipe, '[]'::jsonb)
      ) ORDER BY pw.data_inicio
    )
  )
) AS payload_webhook
FROM pautas_with_team pw;

-- 3️⃣ DISPARAR WEBHOOK DE TESTE (ENVIA DE VERDADE!)
-- ============================================================================
-- ⚠️ ATENÇÃO: Este comando vai ENVIAR O WEBHOOK para o Growave!
-- Descomente para executar:

-- SELECT public.test_daily_pautas_webhook();

-- 4️⃣ CRIAR PAUTAS DE TESTE PARA AMANHÃ (OPCIONAL)
-- ============================================================================
-- Se você não tem pautas para amanhã e quer criar algumas para teste:

/*
-- Pauta 1: Com Filmmaker e Fotógrafo
INSERT INTO public.pautas_events (
  titulo,
  descricao,
  data_inicio,
  data_fim,
  tipo,
  prioridade,
  status,
  criado_por
) VALUES (
  'Teste - Cobertura Evento X',
  'Teste do webhook diário',
  (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours') AT TIME ZONE 'America/Sao_Paulo',
  (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '12 hours') AT TIME ZONE 'America/Sao_Paulo',
  'evento',
  'alta',
  'pendente',
  auth.uid()
);

-- Pauta 2: Com Jornalista
INSERT INTO public.pautas_events (
  titulo,
  descricao,
  data_inicio,
  data_fim,
  tipo,
  prioridade,
  status,
  criado_por
) VALUES (
  'Teste - Reunião Cliente Y',
  'Teste do webhook diário',
  (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours') AT TIME ZONE 'America/Sao_Paulo',
  (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours') AT TIME ZONE 'America/Sao_Paulo',
  'reuniao',
  'media',
  'pendente',
  auth.uid()
);
*/

-- 5️⃣ LIMPAR PAUTAS DE TESTE (OPCIONAL)
-- ============================================================================
-- Para remover as pautas de teste criadas acima:

/*
DELETE FROM public.pautas_events
WHERE titulo LIKE 'Teste -%'
  AND descricao = 'Teste do webhook diário';
*/

-- ============================================================================
-- DICAS
-- ============================================================================
-- 
-- 📊 Para ver um resumo rápido:
--    Execute apenas o query 1️⃣
--
-- 🔍 Para ver o JSON completo que será enviado:
--    Execute apenas o query 2️⃣
--
-- 🚀 Para testar de verdade (envia o webhook):
--    Descomente e execute o query 3️⃣
--
-- ⏰ O webhook automático roda TODOS OS DIAS às 18h (Brasília)
--
-- ============================================================================
