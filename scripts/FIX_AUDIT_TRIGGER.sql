-- CORREÇÃO DEFINITIVA: Modificar trigger de auditoria para lidar com service role
-- O problema: auth.uid() retorna NULL quando executado via SQL Editor (service role)
-- A solução: usar COALESCE para fornecer um UUID padrão quando auth.uid() é NULL

BEGIN;

-- Recriar a função de trigger com tratamento para auth.uid() NULL
CREATE OR REPLACE FUNCTION public.log_pauta_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Se auth.uid() for NULL (service role), usar um UUID especial para "sistema"
  -- Você pode criar um usuário "sistema" ou usar um UUID fixo
  v_user_id := COALESCE(
    auth.uid(), 
    '00000000-0000-0000-0000-000000000000'::UUID -- UUID para operações do sistema
  );
  
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.pautas_audit_log (event_id, user_id, action, changed_data)
    VALUES (
      OLD.id,
      v_user_id,
      'DELETE',
      to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.pautas_audit_log (event_id, user_id, action, changed_data)
    VALUES (
      NEW.id,
      v_user_id,
      'UPDATE',
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO public.pautas_audit_log (event_id, user_id, action, changed_data)
    VALUES (
      NEW.id,
      v_user_id,
      'CREATE',
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Agora você pode deletar a pauta normalmente:
DELETE FROM pautas_events 
WHERE LOWER(titulo) LIKE '%teste%';

-- Verificar
SELECT id, titulo FROM pautas_events WHERE LOWER(titulo) LIKE '%teste%';
