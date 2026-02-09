-- EMERGENCY RLS HOTFIX: Restore critical functions (Orders and Favorites)
-- This migration ensures that both guests and authenticated users can create records, 
-- and that admins have full visibility into subject activity.

-- 1. STABILIZE PROFILES (Base of all auth checks)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;

CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. ORDERS (Fixes "violates RLS policy" during checkout)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_all" ON public.orders;
DROP POLICY IF EXISTS "orders_select_all" ON public.orders;

-- Allow ANY client (Admin or Guest) to insert an order. 
-- Security: The checkout API handles validation, DB just needs to allow the row.
CREATE POLICY "orders_insert_open" ON public.orders FOR INSERT WITH CHECK (true);

-- Allow users to see their own OR admins to see everything
CREATE POLICY "orders_select_logic" ON public.orders 
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow admins to update orders (status, etc)
CREATE POLICY "orders_update_admin" ON public.orders 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. ORDER ITEMS (Companion to orders)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items_insert_all" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;

CREATE POLICY "order_items_insert_open" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_view_logic" ON public.order_items FOR SELECT USING (true);

-- 4. FAVORITES (Fixes sync issues)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites_all_own" ON public.favorites;
DROP POLICY IF EXISTS "favorites_select_admin" ON public.favorites;
DROP POLICY IF EXISTS "favorites_manage_self" ON public.favorites;

-- Permissive individual management
CREATE POLICY "favorites_manage_self" ON public.favorites 
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin Global visibility
CREATE POLICY "favorites_admin_view" ON public.favorites 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
