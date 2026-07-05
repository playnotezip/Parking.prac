-- Create auto-confirm trigger for auth.users to support instant login for username IDs
-- Bypasses the email verification mail requirement at the database level

-- Create function to auto-confirm email fields
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  NEW.confirmed_at = COALESCE(NEW.confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger BEFORE INSERT on auth.users
DROP TRIGGER IF EXISTS tr_auto_confirm_user ON auth.users;

CREATE TRIGGER tr_auto_confirm_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();
