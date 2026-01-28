-- ============================================================================
-- VERIFICAR CONFIGURAÇÃO DOS WEBHOOKS AGENDADOS
-- ============================================================================
-- Execute este script no SQL Editor do Supabase para verificar os jobs

-- 1. LISTAR TODOS OS JOBS AGENDADOS
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active,
  database
FROM cron.job
WHERE jobname LIKE '%webhook%'
ORDER BY jobname;

-- 2. VER ÚLTIMA EXECUÇÃO DE CADA JOB
SELECT 
  j.jobname,
  jr.start_time,
  jr.end_time,
  jr.status,
  jr.return_message
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname IN ('send-daily-pautas-webhook', 'send-weekly-fds-webhook')
ORDER BY jr.start_time DESC
LIMIT 20;

-- 3. VERIFICAR SE OS JOBS ESTÃO ATIVOS
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-pautas-webhook' AND active = true) 
    THEN '✅ ATIVO' 
    ELSE '❌ INATIVO' 
  END as daily_pautas_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-weekly-fds-webhook' AND active = true) 
    THEN '✅ ATIVO' 
    ELSE '❌ INATIVO' 
  END as weekly_fds_status;

-- 4. VER DETALHES DOS JOBS
SELECT 
  jobname,
  schedule,
  CASE 
    WHEN jobname = 'send-daily-pautas-webhook' THEN 'Deveria rodar: Todo dia às 18h (Brasília)'
    WHEN jobname = 'send-weekly-fds-webhook' THEN 'Deveria rodar: Quinta às 17:58 (Brasília)'
    ELSE 'N/A'
  END as horario_esperado,
  active as ativo
FROM cron.job
WHERE jobname IN ('send-daily-pautas-webhook', 'send-weekly-fds-webhook');

-- ============================================================================
-- CORREÇÃO SE NECESSÁRIO
-- ============================================================================

-- Se o job de pautas diárias estiver com horário errado, desagendar e reagendar:
-- SELECT cron.unschedule('send-daily-pautas-webhook');
-- SELECT cron.schedule('send-daily-pautas-webhook', '0 21 * * *', 'SELECT public.send_daily_pautas_webhook();');

-- Se o job de FDS estiver com horário errado, desagendar e reagendar:
-- SELECT cron.unschedule('send-weekly-fds-webhook');
-- SELECT cron.schedule('send-weekly-fds-webhook', '58 20 * * 4', 'SELECT public.send_weekly_fds_webhook();');
