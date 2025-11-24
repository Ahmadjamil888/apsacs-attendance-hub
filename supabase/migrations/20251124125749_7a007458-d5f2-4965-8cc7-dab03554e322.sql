-- Add superadmin role to principal@apsacs.com
-- You can change this to any email you want to be the superadmin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::user_role
FROM auth.users
WHERE email = 'principal@apsacs.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Optionally, add roles to the other users as teachers
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'teacher'::user_role
FROM auth.users
WHERE email IN ('maryam@apsacs.com', 'teacher@apsacs.com')
ON CONFLICT (user_id, role) DO NOTHING;