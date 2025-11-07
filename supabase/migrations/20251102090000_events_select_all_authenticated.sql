-- Permitir que todos os usuários autenticados visualizem a Agenda (tabela events)
-- Mantém políticas de INSERT/UPDATE/DELETE existentes restritas ao criador

-- Garantir que RLS esteja habilitado
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Política permissiva de SELECT para usuários autenticados
-- Observação: auth.role() = 'authenticated' indica sessão com JWT válido
CREATE POLICY "events_select_all_authenticated" ON public.events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Opcional: se preferir, pode usar auth.uid() IS NOT NULL
-- CREATE POLICY "events_select_all_authenticated" ON public.events
--   FOR SELECT USING (auth.uid() IS NOT NULL);