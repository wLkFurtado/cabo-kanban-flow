-- ============================================================================
-- WEBHOOK DIÁRIO DE PAUTAS
-- ============================================================================
-- Este migration cria um job agendado (pg_cron) que envia um webhook
-- todos os dias às 18h com todas as pautas programadas para o dia seguinte
-- ============================================================================

-- 1. HABILITAR EXTENSÃO PG_CRON (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. FUNÇÃO QUE ENVIA WEBHOOK COM PAUTAS DO DIA SEGUINTE
CREATE OR REPLACE FUNCTION public.send_daily_pautas_webhook()
RETURNS void AS $$
DECLARE
  webhook_url TEXT := 'https://webhooks.growave.com.br/webhook/PAUTAS';
  pautas_array JSONB := '[]'::jsonb;
  pauta_record RECORD;
  filmmaker_profile RECORD;
  fotografo_profile RECORD;
  jornalista_profile RECORD;
  rede_profile RECORD;
  equipe_array JSONB;
  tomorrow_start TIMESTAMP WITH TIME ZONE;
  tomorrow_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular o intervalo do dia seguinte (00:00 até 23:59:59)
  tomorrow_start := (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/Sao_Paulo';
  tomorrow_end := (CURRENT_DATE + INTERVAL '2 days' - INTERVAL '1 second') AT TIME ZONE 'America/Sao_Paulo';

  -- Log para debug
  RAISE NOTICE 'Buscando pautas de % até %', tomorrow_start, tomorrow_end;

  -- Buscar todas as pautas do dia seguinte
  FOR pauta_record IN
    SELECT 
      id,
      titulo,
      data_inicio,
      filmmaker_id,
      fotografo_id,
      jornalista_id,
      rede_id
    FROM public.pautas_events
    WHERE data_inicio >= tomorrow_start
      AND data_inicio < tomorrow_end
    ORDER BY data_inicio
  LOOP
    -- Reset equipe_array para cada pauta
    equipe_array := '[]'::jsonb;

    -- Buscar dados dos membros da equipe
    IF pauta_record.filmmaker_id IS NOT NULL THEN
      SELECT full_name, phone INTO filmmaker_profile
      FROM public.profiles WHERE id = pauta_record.filmmaker_id;
      
      equipe_array := equipe_array || jsonb_build_object(
        'funcao', 'Filmmaker',
        'nome', COALESCE(filmmaker_profile.full_name, 'Nome não disponível'),
        'telefone', filmmaker_profile.phone
      );
    END IF;

    IF pauta_record.fotografo_id IS NOT NULL THEN
      SELECT full_name, phone INTO fotografo_profile
      FROM public.profiles WHERE id = pauta_record.fotografo_id;
      
      equipe_array := equipe_array || jsonb_build_object(
        'funcao', 'Fotógrafo',
        'nome', COALESCE(fotografo_profile.full_name, 'Nome não disponível'),
        'telefone', fotografo_profile.phone
      );
    END IF;

    IF pauta_record.jornalista_id IS NOT NULL THEN
      SELECT full_name, phone INTO jornalista_profile
      FROM public.profiles WHERE id = pauta_record.jornalista_id;
      
      equipe_array := equipe_array || jsonb_build_object(
        'funcao', 'Jornalista',
        'nome', COALESCE(jornalista_profile.full_name, 'Nome não disponível'),
        'telefone', jornalista_profile.phone
      );
    END IF;

    IF pauta_record.rede_id IS NOT NULL THEN
      SELECT full_name, phone INTO rede_profile
      FROM public.profiles WHERE id = pauta_record.rede_id;
      
      equipe_array := equipe_array || jsonb_build_object(
        'funcao', 'Rede',
        'nome', COALESCE(rede_profile.full_name, 'Nome não disponível'),
        'telefone', rede_profile.phone
      );
    END IF;

    -- Adicionar pauta ao array
    pautas_array := pautas_array || jsonb_build_object(
      'id', pauta_record.id,
      'nome_pauta', COALESCE(pauta_record.titulo, 'Evento'),
      'data', pauta_record.data_inicio,
      'equipe', equipe_array
    );

    RAISE NOTICE 'Pauta adicionada: %', pauta_record.titulo;
  END LOOP;

  -- Se houver pautas para enviar
  IF jsonb_array_length(pautas_array) > 0 THEN
    -- Enviar webhook usando extensão HTTP
    PERFORM http_post(
      webhook_url,
      jsonb_build_object(
        'tipo', 'resumo_diario',
        'data_pautas', (CURRENT_DATE + INTERVAL '1 day')::date,
        'total', jsonb_array_length(pautas_array),
        'pautas', pautas_array
      )::text,
      'application/json'
    );

    RAISE NOTICE 'Webhook enviado com % pautas', jsonb_array_length(pautas_array);
  ELSE
    RAISE NOTICE 'Nenhuma pauta encontrada para o dia seguinte';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao enviar webhook diário de pautas: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. AGENDAR JOB PARA RODAR TODOS OS DIAS ÀS 18H (hora de Brasília = UTC-3)
-- 18h em Brasília = 21h UTC (no horário padrão)
-- Nota: Se estiver em horário de verão, ajustar para 20h UTC

-- Remover job anterior se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-pautas-webhook') THEN
    PERFORM cron.unschedule('send-daily-pautas-webhook');
  END IF;
END
$$;

-- Criar novo job para rodar às 21h UTC (18h Brasília)
SELECT cron.schedule(
  'send-daily-pautas-webhook',  -- nome do job
  '0 21 * * *',                 -- cron: todo dia às 21h UTC (18h Brasília)
  'SELECT public.send_daily_pautas_webhook();'
);

-- 4. COMENTÁRIOS
COMMENT ON FUNCTION public.send_daily_pautas_webhook() IS 
  'Envia webhook diário com todas as pautas programadas para o dia seguinte. Executado via pg_cron todos os dias às 18h (Brasília).';

-- 5. CRIAR FUNÇÃO AUXILIAR PARA TESTAR MANUALMENTE
CREATE OR REPLACE FUNCTION public.test_daily_pautas_webhook()
RETURNS jsonb AS $$
DECLARE
  result JSONB;
BEGIN
  PERFORM public.send_daily_pautas_webhook();
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Webhook de teste enviado. Verifique os logs com RAISE NOTICE.',
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.test_daily_pautas_webhook() IS 
  'Função auxiliar para testar o envio do webhook diário manualmente. Execute: SELECT public.test_daily_pautas_webhook();';

-- ============================================================================
-- COMO TESTAR
-- ============================================================================
-- 1. Para testar manualmente:
--    SELECT public.test_daily_pautas_webhook();
--
-- 2. Para ver os jobs agendados:
--    SELECT * FROM cron.job WHERE jobname = 'send-daily-pautas-webhook';
--
-- 3. Para ver o histórico de execuções:
--    SELECT * FROM cron.job_run_details 
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-daily-pautas-webhook')
--    ORDER BY start_time DESC LIMIT 10;
--
-- 4. Para desabilitar o job temporariamente:
--    SELECT cron.unschedule('send-daily-pautas-webhook');
--
-- 5. Para reabilitar:
--    SELECT cron.schedule('send-daily-pautas-webhook', '0 21 * * *', 
--           'SELECT public.send_daily_pautas_webhook();');
-- ============================================================================
