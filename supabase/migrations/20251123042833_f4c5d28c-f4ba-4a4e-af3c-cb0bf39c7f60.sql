-- Drop existing policies on classes
DROP POLICY IF EXISTS "Everyone can view classes" ON public.classes;
DROP POLICY IF EXISTS "Principals and superadmins can manage classes" ON public.classes;

-- Drop existing policies on teacher_assignments
DROP POLICY IF EXISTS "Teachers can view their assignments" ON public.teacher_assignments;
DROP POLICY IF EXISTS "Principals and superadmins can manage assignments" ON public.teacher_assignments;

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Principals and superadmins can manage roles" ON public.user_roles;

-- Drop existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Principals and superadmins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can update profiles" ON public.profiles;

-- Drop existing policies on attendance_records
DROP POLICY IF EXISTS "Teachers can view attendance for their classes" ON public.attendance_records;
DROP POLICY IF EXISTS "Principals and superadmins can manage all attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Class incharge can mark attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Class incharge can update attendance" ON public.attendance_records;

-- Create new policies for classes
CREATE POLICY "Everyone can view classes"
ON public.classes FOR SELECT
USING (true);

CREATE POLICY "Principals and superadmins can manage classes"
ON public.classes FOR ALL
USING (has_role(auth.uid(), 'principal'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- Create new policies for teacher_assignments
CREATE POLICY "Teachers can view their assignments"
ON public.teacher_assignments FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Principals and superadmins can manage assignments"
ON public.teacher_assignments FOR ALL
USING (has_role(auth.uid(), 'principal'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- Create new policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Principals and superadmins can manage roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'principal'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

-- Create new policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Principals and superadmins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'principal'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

CREATE POLICY "Superadmins can update profiles"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'superadmin'::user_role));

-- Create new policies for attendance_records
CREATE POLICY "Teachers can view attendance for their classes"
ON public.attendance_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments
    WHERE teacher_assignments.teacher_id = auth.uid()
    AND teacher_assignments.class_id = attendance_records.class_id
  )
  OR has_role(auth.uid(), 'principal'::user_role)
);

CREATE POLICY "Principals and superadmins can manage all attendance"
ON public.attendance_records FOR ALL
USING (has_role(auth.uid(), 'principal'::user_role) OR has_role(auth.uid(), 'superadmin'::user_role));

CREATE POLICY "Class incharge can mark attendance"
ON public.attendance_records FOR INSERT
WITH CHECK (is_class_incharge(auth.uid(), class_id));

CREATE POLICY "Class incharge can update attendance"
ON public.attendance_records FOR UPDATE
USING (is_class_incharge(auth.uid(), class_id));