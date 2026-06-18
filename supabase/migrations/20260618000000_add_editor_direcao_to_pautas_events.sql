-- ============================================================================
-- MIGRAÇÃO: Adicionar campos editor_id e direcao_id à tabela pautas_events
-- editor_id: UUID[] para múltiplos editores (filtro: filmmaker + editor)
-- direcao_id: UUID[] para múltiplas pessoas na direção (sem filtro de cargo)
-- ============================================================================

-- 1. Adicionar colunas como UUID[] (array) com default vazio
ALTER TABLE public.pautas_events
  ADD COLUMN IF NOT EXISTS editor_id UUID[] DEFAULT ARRAY[]::UUID[],
  ADD COLUMN IF NOT EXISTS direcao_id UUID[] DEFAULT ARRAY[]::UUID[];

-- 2. Criar índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_pautas_events_editor ON public.pautas_events USING GIN (editor_id);
CREATE INDEX IF NOT EXISTS idx_pautas_events_direcao ON public.pautas_events USING GIN (direcao_id);

-- 3. Atualizar webhook function diário para incluir editor e direção
CREATE OR REPLACE FUNCTION public.send_daily_pautas_webhook()
RETURNS void AS $$
DECLARE
  webhook_url TEXT := 'https://webhooks.growave.com.br/webhook/PAUTAS';
  pautas_array JSONB := '[]'::jsonb;
  pauta_record RECORD;
  profile_record RECORD;
  equipe_array JSONB;
  member_id UUID;
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
      rede_id,
      editor_id,
      direcao_id
    FROM public.pautas_events
    WHERE data_inicio >= tomorrow_start
      AND data_inicio < tomorrow_end
    ORDER BY data_inicio
  LOOP
    -- Reset equipe_array para cada pauta
    equipe_array := '[]'::jsonb;

    -- Buscar dados dos membros da equipe (Filmmakers)
    IF pauta_record.filmmaker_id IS NOT NULL AND array_length(pauta_record.filmmaker_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY pauta_record.filmmaker_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Filmmaker',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Fotógrafos)
    IF pauta_record.fotografo_id IS NOT NULL AND array_length(pauta_record.fotografo_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY pauta_record.fotografo_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Fotógrafo',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Jornalistas)
    IF pauta_record.jornalista_id IS NOT NULL AND array_length(pauta_record.jornalista_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY pauta_record.jornalista_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Jornalista',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Rede)
    IF pauta_record.rede_id IS NOT NULL AND array_length(pauta_record.rede_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY pauta_record.rede_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Rede',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Editor)
    IF pauta_record.editor_id IS NOT NULL AND array_length(pauta_record.editor_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY pauta_record.editor_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Editor',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Direção)
    IF pauta_record.direcao_id IS NOT NULL AND array_length(pauta_record.direcao_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY pauta_record.direcao_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Direção',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
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


-- 4. Atualizar função de webhook direto para incluir editor e direção
CREATE OR REPLACE FUNCTION public.send_pauta_webhook_direct()
RETURNS TRIGGER AS $$
DECLARE
  team_changed BOOLEAN := FALSE;
  webhook_url TEXT := 'https://webhooks.growave.com.br/webhook/PAUTAS';
  payload JSONB;
  profile_record RECORD;
  equipe_array JSONB := '[]'::jsonb;
  member_id UUID;
BEGIN
  -- Verificar se algum campo da equipe foi alterado
  IF TG_OP = 'INSERT' THEN
    team_changed := (
      (NEW.filmmaker_id IS NOT NULL AND array_length(NEW.filmmaker_id, 1) > 0) OR 
      (NEW.fotografo_id IS NOT NULL AND array_length(NEW.fotografo_id, 1) > 0) OR 
      (NEW.jornalista_id IS NOT NULL AND array_length(NEW.jornalista_id, 1) > 0) OR 
      (NEW.rede_id IS NOT NULL AND array_length(NEW.rede_id, 1) > 0) OR
      (NEW.editor_id IS NOT NULL AND array_length(NEW.editor_id, 1) > 0) OR
      (NEW.direcao_id IS NOT NULL AND array_length(NEW.direcao_id, 1) > 0)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    team_changed := (
      (OLD.filmmaker_id IS DISTINCT FROM NEW.filmmaker_id) OR
      (OLD.fotografo_id IS DISTINCT FROM NEW.fotografo_id) OR
      (OLD.jornalista_id IS DISTINCT FROM NEW.jornalista_id) OR
      (OLD.rede_id IS DISTINCT FROM NEW.rede_id) OR
      (OLD.editor_id IS DISTINCT FROM NEW.editor_id) OR
      (OLD.direcao_id IS DISTINCT FROM NEW.direcao_id)
    );
  END IF;

  -- Se houve mudança na equipe, enviar webhook
  IF team_changed THEN
    -- Buscar dados dos membros da equipe (Filmmakers)
    IF NEW.filmmaker_id IS NOT NULL AND array_length(NEW.filmmaker_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY NEW.filmmaker_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Filmmaker',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Fotógrafos)
    IF NEW.fotografo_id IS NOT NULL AND array_length(NEW.fotografo_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY NEW.fotografo_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Fotógrafo',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Jornalistas)
    IF NEW.jornalista_id IS NOT NULL AND array_length(NEW.jornalista_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY NEW.jornalista_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Jornalista',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Rede)
    IF NEW.rede_id IS NOT NULL AND array_length(NEW.rede_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY NEW.rede_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Rede',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Editor)
    IF NEW.editor_id IS NOT NULL AND array_length(NEW.editor_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY NEW.editor_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Editor',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Buscar dados dos membros da equipe (Direção)
    IF NEW.direcao_id IS NOT NULL AND array_length(NEW.direcao_id, 1) > 0 THEN
      FOREACH member_id IN ARRAY NEW.direcao_id
      LOOP
        SELECT full_name, phone INTO profile_record
        FROM public.profiles WHERE id = member_id;
        IF FOUND THEN
          equipe_array := equipe_array || jsonb_build_object(
            'funcao', 'Direção',
            'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
            'telefone', profile_record.phone
          );
        END IF;
      END LOOP;
    END IF;

    -- Montar payload completo
    payload := jsonb_build_object(
      'nome_pauta', COALESCE(NEW.titulo, 'Evento'),
      'data', NEW.data_inicio,
      'equipe', equipe_array
    );

    -- Enviar webhook usando extensão HTTP
    PERFORM http_post(
      webhook_url,
      payload::text,
      'application/json'
    );

    -- Log para debug (opcional)
    RAISE NOTICE 'Webhook enviado para pauta %: %', NEW.id, payload;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
