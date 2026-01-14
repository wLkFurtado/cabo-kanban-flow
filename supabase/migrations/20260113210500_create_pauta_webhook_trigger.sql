-- Migration: Criar trigger para disparar webhook quando equipe for selecionada em pauta
-- Data: 2026-01-13

-- Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.trigger_pauta_webhook()
RETURNS TRIGGER AS $$
DECLARE
  team_changed BOOLEAN := FALSE;
BEGIN
  -- Verificar se algum campo da equipe foi alterado
  IF TG_OP = 'INSERT' THEN
    -- Em INSERT, disparar se pelo menos um membro estiver selecionado
    team_changed := (
      NEW.filmmaker_id IS NOT NULL OR 
      NEW.fotografo_id IS NOT NULL OR 
      NEW.jornalista_id IS NOT NULL OR 
      NEW.rede_id IS NOT NULL
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Em UPDATE, disparar se qualquer campo da equipe mudou
    team_changed := (
      (OLD.filmmaker_id IS DISTINCT FROM NEW.filmmaker_id) OR
      (OLD.fotografo_id IS DISTINCT FROM NEW.fotografo_id) OR
      (OLD.jornalista_id IS DISTINCT FROM NEW.jornalista_id) OR
      (OLD.rede_id IS DISTINCT FROM NEW.rede_id)
    );
  END IF;

  -- Se houve mudança na equipe, invocar a Edge Function
  IF team_changed THEN
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-pauta-webhook',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
        ),
        body := jsonb_build_object(
          'pauta_id', NEW.id
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
DROP TRIGGER IF EXISTS on_pauta_team_change ON public.pautas_events;
CREATE TRIGGER on_pauta_team_change
  AFTER INSERT OR UPDATE ON public.pautas_events
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_pauta_webhook();

-- Comentários para documentação
COMMENT ON FUNCTION public.trigger_pauta_webhook() IS 
  'Dispara webhook para Growave quando equipe for selecionada ou alterada em uma pauta';
COMMENT ON TRIGGER on_pauta_team_change ON public.pautas_events IS 
  'Trigger que invoca função para enviar webhook quando membros da equipe são alterados';
