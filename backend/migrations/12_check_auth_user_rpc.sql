-- Function to check if a user exists in auth.users
-- This is secure because it's SECURITY DEFINER but only returns a boolean
CREATE OR REPLACE FUNCTION public.check_auth_user_exists(email_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE email = email_check);
END;
$$;
