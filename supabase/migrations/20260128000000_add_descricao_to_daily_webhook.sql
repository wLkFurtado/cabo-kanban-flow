-- ============================================================================
-- ATUALIZAR FUNÇÃO DE WEBHOOK DIÁRIO DE PAUTAS PARA INCLUIR DESCRIÇÃO
-- ============================================================================
-- Esta migration atualiza a função send_daily_pautas_webhook() para incluir
-- o campo 'descricao' no payload enviado ao webhook
-- ============================================================================

-- Recriar a função com descrição incluída
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

  -- Buscar todas as pautas do dia seguinte (INCLUINDO DESCRIÇÃO)
  FOR pauta_record IN
    SELECT 
      id,
      titulo,
      descricao,
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

    -- Adicionar pauta ao array (INCLUINDO DESCRIÇÃO)
    pautas_array := pautas_array || jsonb_build_object(
      'id', pauta_record.id,
      'nome_pauta', COALESCE(pauta_record.titulo, 'Evento'),
      'descricao', COALESCE(pauta_record.descricao, ''),
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

COMMENT ON FUNCTION public.send_daily_pautas_webhook() IS 
  'Envia webhook diário com todas as pautas programadas para o dia seguinte, incluindo descrição. Executado via pg_cron todos os dias às 18h (Brasília).';
