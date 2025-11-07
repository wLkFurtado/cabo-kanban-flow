-- First, ensure the user profile exists
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'user'
FROM auth.users au
WHERE au.email = 'wallker.furtado@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
  );

-- Create a test board for the user
INSERT INTO public.boards (id, title, description, owner_id, visibility, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Meu Primeiro Board',
  'Board de exemplo para começar',
  au.id,
  'private',
  now(),
  now()
FROM auth.users au
WHERE au.email = 'wallker.furtado@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.boards b WHERE b.owner_id = au.id
  );

-- Create default lists for the test board
WITH user_board AS (
  SELECT b.id as board_id
  FROM public.boards b
  JOIN auth.users au ON b.owner_id = au.id
  WHERE au.email = 'wallker.furtado@gmail.com'
  LIMIT 1
)
INSERT INTO public.board_lists (id, board_id, title, position, color, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  ub.board_id,
  list_data.title,
  list_data.position,
  list_data.color,
  now(),
  now()
FROM user_board ub
CROSS JOIN (
  VALUES 
    ('A Fazer', 0, '#ef4444'),
    ('Em Progresso', 1, '#f59e0b'),
    ('Concluído', 2, '#10b981')
) AS list_data(title, position, color);