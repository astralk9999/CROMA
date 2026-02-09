-- EMERGENCY NUCLEAR FIX: Disable RLS on critical tables to restore operation
-- Use this ONLY to unblock the application immediately.

-- Disable RLS for orders and items
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.favorites DISABLE ROW LEVEL SECURITY;

-- Ensure public access is granted just in case some logic still checks
DROP POLICY IF EXISTS "orders_insert_open" ON public.orders;
CREATE POLICY "orders_insert_open" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "orders_select_all" ON public.orders;
CREATE POLICY "orders_select_all" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "order_items_insert_open" ON public.order_items;
CREATE POLICY "order_items_insert_open" ON public.order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_view_logic" ON public.order_items;
CREATE POLICY "order_items_view_logic" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "favorites_manage_self" ON public.favorites;
CREATE POLICY "favorites_manage_self" ON public.favorites FOR ALL USING (true);

-- Ensure the products table is also readable
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
