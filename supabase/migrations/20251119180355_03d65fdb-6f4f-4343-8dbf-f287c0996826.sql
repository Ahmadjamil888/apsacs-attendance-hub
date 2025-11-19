-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('principal', 'teacher');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_number INTEGER NOT NULL CHECK (class_number BETWEEN 1 AND 12),
  section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  total_students INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (class_number, section)
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create teacher_assignments table
CREATE TABLE public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  is_incharge BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (teacher_id, class_id)
);

ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  present_count INTEGER NOT NULL CHECK (present_count >= 0),
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (class_id, attendance_date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to check if user is class incharge
CREATE OR REPLACE FUNCTION public.is_class_incharge(_user_id UUID, _class_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_assignments
    WHERE teacher_id = _user_id AND class_id = _class_id AND is_incharge = TRUE
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Principals can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'principal'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Principals can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'principal'));

-- RLS Policies for classes
CREATE POLICY "Everyone can view classes"
ON public.classes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Principals can manage classes"
ON public.classes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'principal'));

-- RLS Policies for teacher_assignments
CREATE POLICY "Teachers can view their assignments"
ON public.teacher_assignments FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Principals can view all assignments"
ON public.teacher_assignments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'principal'));

CREATE POLICY "Principals can manage assignments"
ON public.teacher_assignments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'principal'));

-- RLS Policies for attendance_records
CREATE POLICY "Teachers can view attendance for their classes"
ON public.attendance_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teacher_assignments
    WHERE teacher_id = auth.uid() AND class_id = attendance_records.class_id
  ) OR public.has_role(auth.uid(), 'principal')
);

CREATE POLICY "Class incharge can mark attendance"
ON public.attendance_records FOR INSERT
TO authenticated
WITH CHECK (
  public.is_class_incharge(auth.uid(), class_id)
);

CREATE POLICY "Class incharge can update attendance"
ON public.attendance_records FOR UPDATE
TO authenticated
USING (
  public.is_class_incharge(auth.uid(), class_id)
);

CREATE POLICY "Principals can manage all attendance"
ON public.attendance_records FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'principal'));

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert all classes (1-12, sections A-G)
DO $$
DECLARE
  class_num INTEGER;
  sec TEXT;
BEGIN
  FOR class_num IN 1..12 LOOP
    FOREACH sec IN ARRAY ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G'] LOOP
      INSERT INTO public.classes (class_number, section, total_students)
      VALUES (class_num, sec, 30); -- Default 30 students per class
    END LOOP;
  END LOOP;
END $$;