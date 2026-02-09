-- Nuclear RLS Fix: Stabilize permissions and remove recursion

-- 1. PROFILES Table Refactor
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing profile policies to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create ultra-stable policies
-- Everyone can read profiles (safest for internal lookups and doesn't cause recursion)
CREATE POLICY "profiles_select_public" ON public.profiles
FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. ORDERS Table Stabilization
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Users see their own
CREATE POLICY "orders_select_own" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

-- Users create their own
CREATE POLICY "orders_insert_own" ON public.orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins see ALL (Fixing recursion by avoiding direct profile check in the condition)
-- We check the 'role' column of the CURRENT user in profiles table
-- but we do it using a subquery that should be optimized by Postgres
CREATE POLICY "orders_select_admin" ON public.orders
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 3. FAVORITES Table stabilization
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Admins can view all favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;

CREATE POLICY "favorites_all_own" ON public.favorites
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "favorites_select_admin" ON public.favorites
FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
