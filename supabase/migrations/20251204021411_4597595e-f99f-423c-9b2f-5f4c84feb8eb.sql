-- Update RLS policies to include admin role for teacher management
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
FOR ALL USING (
  has_role(auth.uid(), 'principal'::user_role) OR 
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Admins manage assignments" ON public.teacher_assignments;
CREATE POLICY "Admins manage assignments" ON public.teacher_assignments
FOR ALL USING (
  has_role(auth.uid(), 'principal'::user_role) OR 
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles" ON public.profiles
FOR SELECT USING (
  has_role(auth.uid(), 'principal'::user_role) OR 
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles" ON public.profiles
FOR UPDATE USING (
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Admins manage classes" ON public.classes;
CREATE POLICY "Admins manage classes" ON public.classes
FOR ALL USING (
  has_role(auth.uid(), 'principal'::user_role) OR 
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'admin'::user_role)
);

DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance_records;
CREATE POLICY "Admins manage attendance" ON public.attendance_records
FOR ALL USING (
  has_role(auth.uid(), 'principal'::user_role) OR 
  has_role(auth.uid(), 'superadmin'::user_role) OR
  has_role(auth.uid(), 'admin'::user_role)
);