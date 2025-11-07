BEGIN;

-- Tabela de atividades de cards
CREATE TABLE IF NOT EXISTS public.card_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.card_activities ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para usuários autenticados com acesso ao board
CREATE POLICY card_activities_select ON public.card_activities
  FOR SELECT
  TO authenticated
  USING (public.user_has_board_access(board_id));

-- Permitir inserção por usuários autenticados com acesso ao board e autor igual ao usuário
CREATE POLICY card_activities_insert ON public.card_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_board_access(board_id) AND user_id = auth.uid());

-- Índices úteis
CREATE INDEX IF NOT EXISTS card_activities_card_id_idx ON public.card_activities(card_id);
CREATE INDEX IF NOT EXISTS card_activities_board_id_idx ON public.card_activities(board_id);
CREATE INDEX IF NOT EXISTS card_activities_created_at_idx ON public.card_activities(created_at DESC);

COMMIT;