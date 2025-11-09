-- Backfill phone numbers in public.profiles from auth.users metadata
-- Ensures contacts list shows phone for users registered previously

begin;

update public.profiles p
set phone = nullif(trim(u.raw_user_meta_data->>'phone'), '')
from auth.users u
where p.id = u.id
  and (p.phone is null or p.phone = '')
  and coalesce(nullif(trim(u.raw_user_meta_data->>'phone'), ''), null) is not null;

commit;

-- Note: Access to auth.users requires running this migration via Supabase
-- migrations (server-side). After applying, refresh the PostgREST schema cache.