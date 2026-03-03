-- ============================================================================
-- MIGRAÇÃO: Converter campo rede de UUID (single) para UUID[] (array)
-- Permite múltiplas pessoas na função de Rede, igual jornalistas
-- ============================================================================

-- 1. Remover constraint de FK (UUID referência única não se aplica a array)
ALTER TABLE weekend_teams DROP CONSTRAINT IF EXISTS weekend_teams_rede_fkey;

-- 2. Converter coluna: UUID → UUID[] preservando dados existentes
ALTER TABLE weekend_teams
  ALTER COLUMN rede TYPE UUID[]
  USING CASE WHEN rede IS NOT NULL THEN ARRAY[rede] ELSE ARRAY[]::UUID[] END;

-- 3. Definir default como array vazio
ALTER TABLE weekend_teams ALTER COLUMN rede SET DEFAULT ARRAY[]::UUID[];

-- 4. Atualizar webhook function para iterar array de rede (igual jornalistas)
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
  redes_array JSONB := '[]'::jsonb;
  member_id UUID;
BEGIN
  -- Calcular o próximo sábado
  next_saturday := CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7);
  IF next_saturday = CURRENT_DATE THEN
    next_saturday := CURRENT_DATE + 7;
  END IF;
  
  next_sunday := next_saturday + 1;
  weekend_key_str := next_saturday::TEXT;

  RAISE NOTICE 'Buscando escala para o final de semana: % a %', next_saturday, next_sunday;

  SELECT * INTO fds_record
  FROM public.weekend_teams
  WHERE weekend_key = weekend_key_str;

  IF NOT FOUND THEN
    RAISE NOTICE 'Nenhuma escala cadastrada para o final de semana %', weekend_key_str;
    RETURN;
  END IF;

  equipe_json := '{}'::jsonb;

  -- Chefe (single)
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

  -- Redes (array - igual jornalistas)
  redes_array := '[]'::jsonb;
  IF fds_record.rede IS NOT NULL AND array_length(fds_record.rede, 1) > 0 THEN
    FOREACH member_id IN ARRAY fds_record.rede
    LOOP
      SELECT full_name, phone INTO profile_record
      FROM public.profiles WHERE id = member_id;
      IF FOUND THEN
        redes_array := redes_array || jsonb_build_object(
          'nome', COALESCE(profile_record.full_name, 'Nome não disponível'),
          'telefone', profile_record.phone
        );
      END IF;
    END LOOP;
    equipe_json := equipe_json || jsonb_build_object('redes', redes_array);
  END IF;

  -- Fotógrafo (single)
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

  -- Filmmaker (single)
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

  -- Edição (single)
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

  -- Designer (single)
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

  -- Jornalistas (array)
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

  -- Tamoios (array)
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

  -- Enviar webhook
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
