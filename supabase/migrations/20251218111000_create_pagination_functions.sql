-- Função RPC para carregar mais cards com paginação (lazy load)
-- Complementa get_board_data para boards com mais de 50 cards

CREATE OR REPLACE FUNCTION public.get_more_cards(
  board_uuid uuid,
  offset_count integer DEFAULT 50,
  limit_count integer DEFAULT 50
)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'id', c.id,
        'list_id', c.list_id,
        'title', c.title,
        'position', c.position,
        'priority', c.priority,
        'completed', c.completed,
        'due_date', c.due_date,
        'description', c.description,
        'cover_color', c.cover_color,
        'cover_images', c.cover_images
      )
      ORDER BY c.position
    ),
    '[]'::json
  )
  FROM public.cards c
  JOIN public.board_lists bl ON c.list_id = bl.id
  WHERE bl.board_id = board_uuid
  OFFSET offset_count
  LIMIT limit_count;
$$;

-- Função para contar total de cards de um board
CREATE OR REPLACE FUNCTION public.count_board_cards(board_uuid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.cards c
  JOIN public.board_lists bl ON c.list_id = bl.id
  WHERE bl.board_id = board_uuid;
$$;

GRANT EXECUTE ON FUNCTION public.get_more_cards(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_board_cards(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_more_cards(uuid, integer, integer) IS 
  'Carrega cards adicionais com paginação para lazy loading';
COMMENT ON FUNCTION public.count_board_cards(uuid) IS 
  'Conta total de cards em um board para saber se precisa carregar mais';
