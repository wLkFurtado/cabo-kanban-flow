-- ============================================================================
-- WEBHOOK SEMANAL DA ESCALA DE FINAL DE SEMANA
-- ============================================================================
-- Este migration cria um job agendado (pg_cron) que envia um webhook
-- toda quinta-feira às 17:58 com a escala do próximo final de semana
-- ============================================================================

-- 1. HABILITAR EXTENSÕES (se ainda não estiverem habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- 2. FUNÇÃO QUE ENVIA WEBHOOK COM ESCALA DO PRÓXIMO FINAL DE SEMANA
CREATE OR REPLACE FUNCTION public.send_weekly_fds_webhook()
RETURNS void AS $$
DECLARE
  webhook_url TEXT := 'https://webhooks.growave.com.br/webhook/pautas-fds';
  next_saturday DATE;
  next_sunday DATE;
  weekend_key_str TEXT;
  fds_record RECORD;
  equipe_json JSONB := '{}'::jsonb;
  profile_record RECORD;
  jornalistas_array JSONB := '[]'::jsonb;
  tamoios_array JSONB := '[]'::jsonb;
  member_id UUID;
BEGIN
  -- Calcular o próximo sábado
  -- Se hoje é sexta, pega o sábado de amanhã
  -- Caso contrário, pega o próximo sábado
  next_saturday := CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7);
  IF next_saturday = CURRENT_DATE THEN
    next_saturday := CURRENT_DATE + 7;
  END IF;
  
  next_sunday := next_saturday + 1;
  weekend_key_str := next_saturday::TEXT;

  -- Log para debug
  RAISE NOTICE 'Buscando escala para o final de semana: % a %', next_saturday, next_sunday;

  -- Buscar a escala do próximo final de semana
  SELECT * INTO fds_record
  FROM public.weekend_teams
  WHERE weekend_key = weekend_key_str;

  -- Se não houver escala cadastrada, não enviar webhook
  IF NOT FOUND THEN
    RAISE NOTICE 'Nenhuma escala cadastrada para o final de semana %', weekend_key_str;
    RETURN;
  END IF;

  -- Montar objeto da equipe
  equipe_json := '{}'::jsonb;

  -- Buscar dados do Chefe
  IF fds_record.chefe IS NOT NULL THEN
    SELECT full_name, phone INTO profile_record
    FROM public.profiles WHERE id = fds_record.chefe;
    
    IF FOUND THEN
      equipe_json := equipe_json || jsonb_build_object(
        'chefe', jsonb_build_object(
          'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
          'telefone', profile_record.phone
        )
      );
    END IF;
  END IF;

  -- Buscar dados do Rede
  IF fds_record.rede IS NOT NULL THEN
    SELECT full_name, phone INTO profile_record
    FROM public.profiles WHERE id = fds_record.rede;
    
    IF FOUND THEN
      equipe_json := equipe_json || jsonb_build_object(
        'rede', jsonb_build_object(
          'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
          'telefone', profile_record.phone
        )
      );
    END IF;
  END IF;

  -- Buscar dados do Fotógrafo
  IF fds_record.fotografo IS NOT NULL THEN
    SELECT full_name, phone INTO profile_record
    FROM public.profiles WHERE id = fds_record.fotografo;
    
    IF FOUND THEN
      equipe_json := equipe_json || jsonb_build_object(
        'fotografo', jsonb_build_object(
          'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
          'telefone', profile_record.phone
        )
      );
    END IF;
  END IF;

  -- Buscar dados do Filmmaker
  IF fds_record.filmmaker IS NOT NULL THEN
    SELECT full_name, phone INTO profile_record
    FROM public.profiles WHERE id = fds_record.filmmaker;
    
    IF FOUND THEN
      equipe_json := equipe_json || jsonb_build_object(
        'filmmaker', jsonb_build_object(
          'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
          'telefone', profile_record.phone
        )
      );
    END IF;
  END IF;

  -- Buscar dados do Edição
  IF fds_record.edicao IS NOT NULL THEN
    SELECT full_name, phone INTO profile_record
    FROM public.profiles WHERE id = fds_record.edicao;
    
    IF FOUND THEN
      equipe_json := equipe_json || jsonb_build_object(
        'edicao', jsonb_build_object(
          'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
          'telefone', profile_record.phone
        )
      );
    END IF;
  END IF;

  -- Buscar dados do Designer
  IF fds_record.designer IS NOT NULL THEN
    SELECT full_name, phone INTO profile_record
    FROM public.profiles WHERE id = fds_record.designer;
    
    IF FOUND THEN
      equipe_json := equipe_json || jsonb_build_object(
        'designer', jsonb_build_object(
          'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
          'telefone', profile_record.phone
        )
      );
    END IF;
  END IF;

  -- Buscar dados dos Jornalistas (array)
  jornalistas_array := '[]'::jsonb;
  IF fds_record.jornalistas IS NOT NULL AND array_length(fds_record.jornalistas, 1) > 0 THEN
    FOREACH member_id IN ARRAY fds_record.jornalistas
    LOOP
      SELECT full_name, phone INTO profile_record
      FROM public.profiles WHERE id = member_id;
      
      IF FOUND THEN
        jornalistas_array := jornalistas_array || jsonb_build_object(
          'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
          'telefone', profile_record.phone
        );
      END IF;
    END LOOP;
    
    equipe_json := equipe_json || jsonb_build_object('jornalistas', jornalistas_array);
  END IF;

  -- Buscar dados dos Tamoios (array)
  tamoios_array := '[]'::jsonb;
  IF fds_record.tamoios IS NOT NULL AND array_length(fds_record.tamoios, 1) > 0 THEN
    FOREACH member_id IN ARRAY fds_record.tamoios
    LOOP
      SELECT full_name, phone INTO profile_record
      FROM public.profiles WHERE id = member_id;
      
      IF FOUND THEN
        tamoios_array := tamoios_array || jsonb_build_object(
          'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
          'telefone', profile_record.phone
        );
      END IF;
    END LOOP;
    
    equipe_json := equipe_json || jsonb_build_object('tamoios', tamoios_array);
  END IF;

  -- Enviar webhook usando extensão HTTP
  PERFORM http_post(
    webhook_url,
    jsonb_build_object(
      'tipo', 'escala_fds',
      'weekend_key', weekend_key_str,
      'data_sabado', next_saturday,
      'data_domingo', next_sunday,
      'equipe', equipe_json,
      'notes', fds_record.notes
    )::text,
    'application/json'
  );

  RAISE NOTICE 'Webhook enviado com sucesso para o final de semana %', weekend_key_str;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao enviar webhook semanal de FDS: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. AGENDAR JOB PARA RODAR TODA QUINTA-FEIRA ÀS 17:58 (hora de Brasília = UTC-3)
-- 17:58 em Brasília = 20:58 UTC (no horário padrão)
-- Cron: 58 20 * * 4 (minuto hora dia mês dia-da-semana)
-- Dia da semana: 4 = quinta-feira

-- Remover job anterior se existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-weekly-fds-webhook') THEN
    PERFORM cron.unschedule('send-weekly-fds-webhook');
  END IF;
END
$$;

-- Criar novo job para rodar às 20:58 UTC de quinta-feira (17:58 Brasília)
SELECT cron.schedule(
  'send-weekly-fds-webhook',     -- nome do job
  '58 20 * * 4',                 -- cron: toda quinta às 20:58 UTC (17:58 Brasília)
  'SELECT public.send_weekly_fds_webhook();'
);

-- 4. COMENTÁRIOS
COMMENT ON FUNCTION public.send_weekly_fds_webhook() IS 
  'Envia webhook semanal com a escala do próximo final de semana. Executado via pg_cron toda quinta-feira às 17:58 (Brasília).';

-- 5. CRIAR FUNÇÃO AUXILIAR PARA TESTAR MANUALMENTE
CREATE OR REPLACE FUNCTION public.test_weekly_fds_webhook()
RETURNS jsonb AS $$
DECLARE
  result JSONB;
BEGIN
  PERFORM public.send_weekly_fds_webhook();
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Webhook de teste enviado. Verifique os logs com RAISE NOTICE.',
    'timestamp', NOW()
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.test_weekly_fds_webhook() IS 
  'Função auxiliar para testar o envio do webhook semanal manualmente. Execute: SELECT public.test_weekly_fds_webhook();';

-- ============================================================================
-- COMO TESTAR
-- ============================================================================
-- 1. Para testar manualmente:
--    SELECT public.test_weekly_fds_webhook();
--
-- 2. Para ver os jobs agendados:
--    SELECT * FROM cron.job WHERE jobname = 'send-weekly-fds-webhook';
--
-- 3. Para ver o histórico de execuções:
--    SELECT * FROM cron.job_run_details 
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-weekly-fds-webhook')
--    ORDER BY start_time DESC LIMIT 10;
--
-- 4. Para desabilitar o job temporariamente:
--    SELECT cron.unschedule('send-weekly-fds-webhook');
--
-- 5. Para reabilitar:
--    SELECT cron.schedule('send-weekly-fds-webhook', '58 20 * * 4', 
--           'SELECT public.send_weekly_fds_webhook();');
-- ============================================================================
