-- Fix audit log trigger to handle NULL user_id from service role operations
-- When executing via SQL Editor, auth.uid() returns NULL, causing NOT NULL constraint violation

BEGIN;

-- Update the audit trigger function to use COALESCE for NULL user_id
CREATE OR REPLACE FUNCTION public.log_pauta_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Use COALESCE to provide a default system UUID when auth.uid() is NULL
  -- This happens when operations are performed via service role (SQL Editor, migrations, etc.)
  v_user_id := COALESCE(
    auth.uid(), 
    '00000000-0000-0000-0000-000000000000'::UUID
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
