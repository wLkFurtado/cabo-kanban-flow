-- Ensure the trigger exists for creating profiles automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profile for the existing user wallker.furtado@gmail.com
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE(au.raw_user_meta_data->>'role', 'user')
FROM auth.users au
WHERE au.email = 'wallker.furtado@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
  );