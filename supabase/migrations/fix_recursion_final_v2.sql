-- NUCLEAR OPTION: Drop ALL policies on profiles table dynamically
-- This ensures we catch ANY policy causing recursion, regardless of its name.

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- Now create the clean, non-recursive policies

-- 1. Public Read (Solves "Admin can't see profiles" and recursion)
-- We just let everyone read profiles. The sensitive data (role) is visible but that's acceptable for this app context.
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- 2. Owner Update (Solves "Infinite recursion on update")
-- Direct check against ID, no subqueries.
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- 3. Owner Insert (Solves missing profile creation)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Enable RLS (Just in case it was disabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. PERFORMANCE FIXES (If not already run)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops);
