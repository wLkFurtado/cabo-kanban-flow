-- Permitir que todos os usuários autenticados visualizem eventos das Pautas
-- Mantém as políticas de INSERT/UPDATE/DELETE existentes restritas ao criador/responsável

-- Garantir que RLS esteja habilitado
ALTER TABLE public.pautas_events ENABLE ROW LEVEL SECURITY;

-- Política permissiva de SELECT para usuários autenticados
CREATE POLICY "pautas_events_select_all_authenticated" ON public.pautas_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Alternativa: auth.uid() IS NOT NULL
-- CREATE POLICY "pautas_events_select_all_authenticated" ON public.pautas_events
--   FOR SELECT USING (auth.uid() IS NOT NULL);