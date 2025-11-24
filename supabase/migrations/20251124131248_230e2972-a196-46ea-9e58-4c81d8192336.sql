-- Create the superadmin user zehanxtech@gmail.com
-- Note: The trigger will automatically create the profile
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert user into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'zehanxtech@gmail.com',
    crypt('Shazahmad77@', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Super Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Assign superadmin role (profile will be created by trigger)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'superadmin'::user_role);
END $$;