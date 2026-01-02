-- Função RPC para carregar dados do board em uma única chamada
-- Reduz egress significativamente ao evitar múltiplas queries separadas
-- Retorna: board + listas + cards (resumidos) em um único JSON

CREATE OR REPLACE FUNCTION public.get_board_data(board_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  board_record record;
BEGIN
  -- Buscar dados do board
  SELECT id, title, description, visibility, owner_id, created_at, updated_at
  INTO board_record
  FROM public.boards
  WHERE id = board_uuid;

  -- Se não encontrou o board, retorna null
  IF board_record IS NULL THEN
    RETURN NULL;
  END IF;

  -- Montar JSON completo com board, listas e cards
  SELECT json_build_object(
    'board', json_build_object(
      'id', board_record.id,
      'title', board_record.title,
      'description', board_record.description,
      'visibility', board_record.visibility,
      'owner_id', board_record.owner_id,
      'created_at', board_record.created_at,
      'updated_at', board_record.updated_at
    ),
    'lists', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', l.id,
          'title', l.title,
          'position', l.position,
          'color', COALESCE(l.color, '#6366f1')
        )
        ORDER BY l.position
      )
      FROM public.board_lists l
      WHERE l.board_id = board_uuid
    ), '[]'::json),
    'cards', COALESCE((
      SELECT json_agg(
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
      )
      FROM public.cards c
      JOIN public.board_lists bl ON c.list_id = bl.id
      WHERE bl.board_id = board_uuid
      LIMIT 50  -- Carrega apenas 50 cards inicialmente para performance
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;

-- Permitir que usuários autenticados executem a função
GRANT EXECUTE ON FUNCTION public.get_board_data(uuid) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_board_data(uuid) IS 
  'Retorna dados do board, listas e cards resumidos em uma única chamada para reduzir egress';
