-- Criar sistema de auditoria para pautas_events
-- Registra todas as ações (CREATE, UPDATE, DELETE) com usuário, timestamp e dados

BEGIN;

-- Tabela de auditoria para pautas
CREATE TABLE IF NOT EXISTS public.pautas_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.pautas_events(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  changed_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_pautas_audit_log_event_id ON public.pautas_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_pautas_audit_log_user_id ON public.pautas_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_pautas_audit_log_created_at ON public.pautas_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pautas_audit_log_action ON public.pautas_audit_log(action);

-- Habilitar RLS
ALTER TABLE public.pautas_audit_log ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins e usuários com pautas_admin podem ver logs
CREATE POLICY "View audit logs: admin or pautas_admin only" ON public.pautas_audit_log
  FOR SELECT USING (
    public.get_current_user_role() = 'admin' OR public.has_scope('pautas_admin')
  );

-- Função de trigger para auditoria automática
CREATE OR REPLACE FUNCTION public.log_pauta_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.pautas_audit_log (event_id, user_id, action, changed_data)
    VALUES (
      OLD.id,
      auth.uid(),
      'DELETE',
      to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.pautas_audit_log (event_id, user_id, action, changed_data)
    VALUES (
      NEW.id,
      auth.uid(),
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
      auth.uid(),
      'CREATE',
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auditoria automática em todas as operações
DROP TRIGGER IF EXISTS pautas_audit_trigger ON public.pautas_events;
CREATE TRIGGER pautas_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pautas_events
  FOR EACH ROW EXECUTE FUNCTION public.log_pauta_audit();

COMMIT;

-- Comentários para documentação
COMMENT ON TABLE public.pautas_audit_log IS 'Registro de auditoria para todas as operações em pautas_events';
COMMENT ON COLUMN public.pautas_audit_log.event_id IS 'ID da pauta (pode ser NULL se a pauta foi excluída)';
COMMENT ON COLUMN public.pautas_audit_log.user_id IS 'Usuário que realizou a ação';
COMMENT ON COLUMN public.pautas_audit_log.action IS 'Tipo de ação: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN public.pautas_audit_log.changed_data IS 'Dados da mudança em formato JSON';
COMMENT ON FUNCTION public.log_pauta_audit() IS 'Função trigger que registra todas as ações em pautas_events';
