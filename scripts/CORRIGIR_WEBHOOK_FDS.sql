-- ============================================================================
-- CORRIGIR HORÁRIO DO WEBHOOK DE FDS
-- ============================================================================
-- O webhook de FDS está rodando na sexta às 18h
-- Mas deveria rodar na QUINTA às 17:58

-- 1. DESAGENDAR O JOB ERRADO
SELECT cron.unschedule('send-weekly-fds-webhook');

-- 2. REAGENDAR CORRETAMENTE
-- Quinta-feira às 17:58 Brasília = 20:58 UTC
-- Cron: 58 20 * * 4 (dia 4 = quinta)
SELECT cron.schedule(
  'send-weekly-fds-webhook',
  '58 20 * * 4',
  'SELECT public.send_weekly_fds_webhook();'
);

-- 3. VERIFICAR SE CORRIGIU
SELECT 
  jobname,
  schedule,
  CASE 
    WHEN schedule = '58 20 * * 4' THEN '✅ CORRETO - Quinta 17:58 (Brasília)'
    ELSE '❌ ERRADO - ' || schedule
  END as status,
  active
FROM cron.job
WHERE jobname = 'send-weekly-fds-webhook';

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- jobname: send-weekly-fds-webhook
-- schedule: 58 20 * * 4
-- status: ✅ CORRETO - Quinta 17:58 (Brasília)
-- active: true
