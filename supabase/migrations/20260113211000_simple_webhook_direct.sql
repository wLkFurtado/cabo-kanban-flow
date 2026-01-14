-- Solução Alternativa: Webhook direto do PostgreSQL (sem Edge Function)
-- Esta é uma versão simplificada que envia o webhook diretamente do trigger
-- usando a extensão pg_net ou http do PostgreSQL

-- 1. HABILITAR EXTENSÃO HTTP (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS http;

-- OU se preferir usar pg_net (mais moderno):
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. FUNÇÃO QUE ENVIA WEBHOOK DIRETAMENTE
CREATE OR REPLACE FUNCTION public.send_pauta_webhook_direct()
RETURNS TRIGGER AS $$
DECLARE
  team_changed BOOLEAN := FALSE;
  webhook_url TEXT := 'https://webhooks.growave.com.br/webhook/PAUTAS';
  payload JSONB;
  filmmaker_profile RECORD;
  fotografo_profile RECORD;
  jornalista_profile RECORD;
  rede_profile RECORD;
  equipe_array JSONB := '[]'::jsonb;
BEGIN
  -- Verificar se algum campo da equipe foi alterado
  IF TG_OP = 'INSERT' THEN
    team_changed := (
      NEW.filmmaker_id IS NOT NULL OR 
      NEW.fotografo_id IS NOT NULL OR 
      NEW.jornalista_id IS NOT NULL OR 
      NEW.rede_id IS NOT NULL
    );
  ELSIF TG_OP = 'UPDATE' THEN
    team_changed := (
      (OLD.filmmaker_id IS DISTINCT FROM NEW.filmmaker_id) OR
      (OLD.fotografo_id IS DISTINCT FROM NEW.fotografo_id) OR
      (OLD.jornalista_id IS DISTINCT FROM NEW.jornalista_id) OR
      (OLD.rede_id IS DISTINCT FROM NEW.rede_id)
    );
  END IF;

  -- Se houve mudança na equipe, enviar webhook
  IF team_changed THEN
    -- Buscar dados dos membros da equipe
    IF NEW.filmmaker_id IS NOT NULL THEN
      SELECT full_name, phone INTO filmmaker_profile
      FROM public.profiles WHERE id = NEW.filmmaker_id;
      
      equipe_array := equipe_array || jsonb_build_object(
        'funcao', 'Filmmaker',
        'nome', COALESCE(filmmaker_profile.full_name, 'Nome não disponível'),
        'telefone', filmmaker_profile.phone
      );
    END IF;

    IF NEW.fotografo_id IS NOT NULL THEN
      SELECT full_name, phone INTO fotografo_profile
      FROM public.profiles WHERE id = NEW.fotografo_id;
      
      equipe_array := equipe_array || jsonb_build_object(
        'funcao', 'Fotógrafo',
        'nome', COALESCE(fotografo_profile.full_name, 'Nome não disponível'),
        'telefone', fotografo_profile.phone
      );
    END IF;

    IF NEW.jornalista_id IS NOT NULL THEN
      SELECT full_name, phone INTO jornalista_profile
      FROM public.profiles WHERE id = NEW.jornalista_id;
      
      equipe_array := equipe_array || jsonb_build_object(
        'funcao', 'Jornalista',
        'nome', COALESCE(jornalista_profile.full_name, 'Nome não disponível'),
        'telefone', jornalista_profile.phone
      );
    END IF;

    IF NEW.rede_id IS NOT NULL THEN
      SELECT full_name, phone INTO rede_profile
      FROM public.profiles WHERE id = NEW.rede_id;
      
      equipe_array := equipe_array || jsonb_build_object(
        'funcao', 'Rede',
        'nome', COALESCE(rede_profile.full_name, 'Nome não disponível'),
        'telefone', rede_profile.phone
      );
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

-- 3. CRIAR/SUBSTITUIR O TRIGGER
DROP TRIGGER IF EXISTS on_pauta_team_change ON public.pautas_events;
CREATE TRIGGER on_pauta_team_change
  AFTER INSERT OR UPDATE ON public.pautas_events
  FOR EACH ROW
  EXECUTE FUNCTION public.send_pauta_webhook_direct();

-- 4. COMENTÁRIOS
COMMENT ON FUNCTION public.send_pauta_webhook_direct() IS 
  'Envia webhook diretamente para Growave quando equipe da pauta é alterada (versão sem Edge Function)';
COMMENT ON TRIGGER on_pauta_team_change ON public.pautas_events IS 
  'Trigger que envia webhook direto do PostgreSQL quando membros da equipe são alterados';

-- PRONTO! Agora teste criando/editando uma pauta com membros da equipe
