-- ==============================================================================
-- PROFILES ROW LEVEL SECURITY & ROLE TAMPERING PROTECTION
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Helper function: verify if requesting user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile or admins read all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own details" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;

-- 3. Read policy: Users read their own profile; admins can read all
CREATE POLICY "Users can read own profile or admins read all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- 4. User update policy: Can edit full_name and phone_number ONLY. Cannot change role!
CREATE POLICY "Users can update own details"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- 5. Admin update policy: Only admins can change user roles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());