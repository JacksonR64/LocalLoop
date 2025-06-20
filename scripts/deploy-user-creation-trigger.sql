-- Deploy User Creation Trigger to Supabase
-- Run this in your Supabase SQL Editor to fix the test timeout issue

-- First, let's create the function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert new user profile when auth user is created
  INSERT INTO public.users (
    id,
    email,
    display_name,
    role,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Try to get a display name from metadata, fallback to email username
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name', 
      split_part(NEW.email, '@', 1)
    ),
    'user', -- Default role for all new users
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to fire on new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions for the trigger to work
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO postgres, anon, authenticated, service_role;

-- Fix existing test accounts by inserting them into users table
-- This will resolve the immediate test timeout issue
INSERT INTO public.users (id, email, display_name, role, email_verified, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) as display_name,
  CASE 
    WHEN au.email LIKE '%admin%' THEN 'admin'
    WHEN au.email LIKE '%staff%' THEN 'organizer' 
    ELSE 'user'
  END as role,
  COALESCE(au.email_confirmed_at IS NOT NULL, false) as email_verified,
  COALESCE(au.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.email IN (
  'test1@localloopevents.xyz',
  'teststaff1@localloopevents.xyz', 
  'testadmin1@localloopevents.xyz',
  'TestLocalLoop@gmail.com'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();

-- Add helpful comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new auth user is created - fixes E2E test timeouts';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers user profile creation for new auth users to prevent infinite retry loops';

-- Verify the fix worked
SELECT 
  u.id,
  u.email,
  u.display_name,
  u.role,
  u.email_verified,
  'Profile exists in users table' as status
FROM public.users u
WHERE u.email IN (
  'test1@localloopevents.xyz',
  'teststaff1@localloopevents.xyz', 
  'testadmin1@localloopevents.xyz',
  'TestLocalLoop@gmail.com'
)
ORDER BY u.email;