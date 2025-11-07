-- Função RPC para criar boards de forma segura, contornando problemas de RLS
CREATE OR REPLACE FUNCTION create_board_safe(
  board_title TEXT,
  board_description TEXT DEFAULT '',
  board_visibility board_visibility DEFAULT 'private',
  board_owner_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  visibility board_visibility,
  owner_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_board_id UUID;
  result_record RECORD;
BEGIN
  -- Verificar se o usuário está autenticado
  IF board_owner_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Inserir o board diretamente, contornando RLS
  INSERT INTO boards (title, description, visibility, owner_id)
  VALUES (board_title, board_description, board_visibility, board_owner_id)
  RETURNING boards.id, boards.title, boards.description, boards.visibility, boards.owner_id, boards.created_at, boards.updated_at
  INTO result_record;

  -- Criar listas padrão
  INSERT INTO board_lists (board_id, title, position, color) VALUES
    (result_record.id, 'A Fazer', 0, '#ef4444'),
    (result_record.id, 'Em Progresso', 1, '#f59e0b'),
    (result_record.id, 'Concluído', 2, '#10b981');

  -- Retornar o board criado
  RETURN QUERY SELECT 
    result_record.id,
    result_record.title,
    result_record.description,
    result_record.visibility,
    result_record.owner_id,
    result_record.created_at,
    result_record.updated_at;
END;
$$;