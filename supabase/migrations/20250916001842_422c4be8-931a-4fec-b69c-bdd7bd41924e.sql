-- Create profile for the current user
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '05aa4ffe-85bf-4525-b459-1842fb4f809f', 
  'wallker.furtado@gmail.com',
  'Wallker Furtado',
  'user'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Create a test board for the user
INSERT INTO public.boards (id, title, description, owner_id, visibility)
VALUES (
  gen_random_uuid(),
  'Meu Primeiro Board',
  'Board inicial para começar a organizar suas tarefas',
  '05aa4ffe-85bf-4525-b459-1842fb4f809f',
  'private'
);

-- Create default lists for the test board
WITH new_board AS (
  SELECT id FROM public.boards 
  WHERE owner_id = '05aa4ffe-85bf-4525-b459-1842fb4f809f' 
  AND title = 'Meu Primeiro Board'
  LIMIT 1
)
INSERT INTO public.board_lists (board_id, title, position, color)
SELECT 
  new_board.id,
  list_data.title,
  list_data.position,
  list_data.color
FROM new_board
CROSS JOIN (
  VALUES 
    ('A Fazer', 0, '#ef4444'),
    ('Em Progresso', 1, '#f59e0b'), 
    ('Concluído', 2, '#10b981')
) AS list_data(title, position, color);

-- Fix the trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();