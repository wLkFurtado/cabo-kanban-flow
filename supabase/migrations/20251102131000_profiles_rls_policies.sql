-- Enable RLS and add self-access policies for public.profiles
-- Allows authenticated users to read/update their own profile (incl. avatar_url)
-- Optionally grants admins broader access via public.get_current_user_role()

-- Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can select their own profile
DROP POLICY IF EXISTS profiles_self_select ON public.profiles;
CREATE POLICY profiles_self_select ON public.profiles
  FOR SELECT
  USING (id = auth.uid() OR public.get_current_user_role() = 'admin');

-- Users can insert their own profile row
DROP POLICY IF EXISTS profiles_self_insert ON public.profiles;
CREATE POLICY profiles_self_insert ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid() OR public.get_current_user_role() = 'admin');

-- Users can update their own profile row
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE
  USING (id = auth.uid() OR public.get_current_user_role() = 'admin');

-- (Optional) Admins can manage all profiles
DROP POLICY IF EXISTS profiles_admin_manage_all ON public.profiles;
CREATE POLICY profiles_admin_manage_all ON public.profiles
  FOR ALL
  USING (public.get_current_user_role() = 'admin');