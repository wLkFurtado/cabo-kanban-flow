-- ============================================================================
-- SCRIPT DE TESTE PARA O WEBHOOK SEMANAL DE FDS
-- ============================================================================
-- Execute este script no SQL Editor do Supabase Dashboard para testar
-- o webhook de escala de final de semana
-- ============================================================================

-- 1. Verificar se o job foi criado com sucesso
SELECT * FROM cron.job WHERE jobname = 'send-weekly-fds-webhook';

-- 2. Testar o envio do webhook manualmente
SELECT public.test_weekly_fds_webhook();

-- 3. Verificar qual seria o próximo sábado
SELECT CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7) AS proximo_sabado;

-- 4. Verificar se existe escala cadastrada para o próximo final de semana
WITH next_saturday AS (
  SELECT CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7) AS saturday
)
SELECT 
  weekend_key,
  chefe,
  rede,
  fotografo,
  filmmaker,
  edicao,
  designer,
  jornalistas,
  tamoios,
  notes
FROM public.weekend_teams
WHERE weekend_key = (SELECT saturday::TEXT FROM next_saturday);

-- 5. Ver histórico de execuções do webhook (após executar o teste)
SELECT
  jobid,
  runid,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-weekly-fds-webhook')
ORDER BY start_time DESC
LIMIT 10;
