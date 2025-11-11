-- Índices para acelerar filtros e ordenações no Kanban
-- Cria índices em colunas usadas frequentemente em WHERE/ORDER BY

-- Listas por board
CREATE INDEX IF NOT EXISTS idx_board_lists_board_id ON public.board_lists (board_id);

-- Cards por lista e ordenação por posição
CREATE INDEX IF NOT EXISTS idx_cards_list_id ON public.cards (list_id);
CREATE INDEX IF NOT EXISTS idx_cards_list_id_position ON public.cards (list_id, position);

-- Tabelas auxiliares por card
CREATE INDEX IF NOT EXISTS idx_card_labels_card_id ON public.card_labels (card_id);
CREATE INDEX IF NOT EXISTS idx_card_comments_card_id ON public.card_comments (card_id);
CREATE INDEX IF NOT EXISTS idx_card_members_card_id ON public.card_members (card_id);

-- Atividades por card
CREATE INDEX IF NOT EXISTS idx_card_activities_card_id ON public.card_activities (card_id);