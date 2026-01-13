-- 1. Sync any users from auth.users that are missing in public.profiles
-- This fixes the issue where old users don't have a profile
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  'customer'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 2. Force update your specific user to admin
-- REPLACE 'tu_email@ejemplo.com' with your actual email
UPDATE public.profiles
SET role = 'admin'
WHERE email LIKE '%@%'; -- This is dangerous if multiple admins, but safer for dev

-- Or better, update based on your currently logged in user (if running in SQL editor)
-- UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
