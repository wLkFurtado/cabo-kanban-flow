-- Add DELETE policy for public.profiles
-- Allows a user to delete their own profile row; admins can delete any.

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Self delete policy
DROP POLICY IF EXISTS profiles_self_delete ON public.profiles;
CREATE POLICY profiles_self_delete ON public.profiles
  FOR DELETE
  USING (id = auth.uid() OR public.get_current_user_role() = 'admin');