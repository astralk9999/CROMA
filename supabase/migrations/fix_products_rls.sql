-- FIX PRODUCTS RLS POLICIES
-- This script ensures admins have full control over products.

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- 2. Create clean policies

-- Allow everyone to view products (this is an e-commerce site)
CREATE POLICY "Public can view products"
ON public.products
FOR SELECT
USING (true);

-- Allow Admins to INSERT
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Allow Admins to UPDATE
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Allow Admins to DELETE
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- 3. Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
