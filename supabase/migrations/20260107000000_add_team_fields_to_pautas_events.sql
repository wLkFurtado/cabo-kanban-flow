-- Adiciona colunas para diferentes funções da equipe na tabela pautas_events
ALTER TABLE public.pautas_events
  ADD COLUMN IF NOT EXISTS filmmaker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fotografo_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS jornalista_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rede_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Adiciona índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_pautas_events_filmmaker ON public.pautas_events(filmmaker_id);
CREATE INDEX IF NOT EXISTS idx_pautas_events_fotografo ON public.pautas_events(fotografo_id);
CREATE INDEX IF NOT EXISTS idx_pautas_events_jornalista ON public.pautas_events(jornalista_id);
CREATE INDEX IF NOT EXISTS idx_pautas_events_rede ON public.pautas_events(rede_id);
