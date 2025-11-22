-- Card attachments table with RLS and cascade delete

CREATE TABLE IF NOT EXISTS public.card_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  size bigint NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE public.card_attachments ENABLE ROW LEVEL SECURITY;

-- Allow read/write for members with access to the board
CREATE POLICY card_attachments_select
  ON public.card_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.board_lists bl ON bl.id = c.list_id
      WHERE c.id = card_id AND public.user_has_board_access(bl.board_id)
    )
  );

CREATE POLICY card_attachments_insert
  ON public.card_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.board_lists bl ON bl.id = c.list_id
      WHERE c.id = card_id AND public.user_has_board_access(bl.board_id)
    )
  );

CREATE POLICY card_attachments_update
  ON public.card_attachments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.board_lists bl ON bl.id = c.list_id
      WHERE c.id = card_id AND public.user_has_board_access(bl.board_id)
    )
  );

CREATE POLICY card_attachments_delete
  ON public.card_attachments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cards c
      JOIN public.board_lists bl ON bl.id = c.list_id
      WHERE c.id = card_id AND public.user_has_board_access(bl.board_id)
    )
  );

