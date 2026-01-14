-- Remove criadores sem scope da política de DELETE de pautas_events
-- Mantém apenas: admins OU usuários com scope 'pautas_admin'
-- 
-- Esta migração remove a permissão para que criadores de eventos possam
-- excluir suas próprias pautas, a menos que sejam admins ou tenham o scope 'pautas_admin'.

BEGIN;

-- Remove a política antiga que permitia criadores excluírem
DROP POLICY IF EXISTS "Delete pautas: creator or admin scope" ON public.pautas_events;

-- Cria nova política que permite apenas admins OU usuários com scope 'pautas_admin'
CREATE POLICY "Delete pautas: admin or scoped users only" ON public.pautas_events
  FOR DELETE USING (
    public.get_current_user_role() = 'admin' OR public.has_scope('pautas_admin')
  );

COMMIT;
