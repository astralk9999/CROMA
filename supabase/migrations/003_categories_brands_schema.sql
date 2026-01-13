-- 003_categories_brands_schema.sql
-- Creates Categories and Brands tables and migrates existing data from Products.

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure Constraints Exist (Fix for ON CONFLICT error)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_key') THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_name_key UNIQUE (name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key') THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
  END IF;
END $$;

-- 2. BRANDS TABLE
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  logo TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brands_name_key') THEN
    ALTER TABLE public.brands ADD CONSTRAINT brands_name_key UNIQUE (name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brands_slug_key') THEN
    ALTER TABLE public.brands ADD CONSTRAINT brands_slug_key UNIQUE (slug);
  END IF;
END $$;

-- 3. ENABLE RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (Simple & Robust)
-- Public Read
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);

-- Admin Write (Fallback for direct access, though we rely on RPC)
CREATE POLICY "Admins write categories" ON public.categories FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Admins write brands" ON public.brands FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
) WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- 5. MIGRATE EXISTING DATA
-- Extract unique categories from products, prioritizing one casing style
INSERT INTO public.categories (name, slug)
SELECT DISTINCT ON (lower(category)) category, lower(category)
FROM public.products
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (slug) DO NOTHING;

-- Extract unique brands from products
INSERT INTO public.brands (name, slug)
SELECT DISTINCT ON (lower(brand)) brand, lower(brand)
FROM public.products
WHERE brand IS NOT NULL AND brand != ''
ON CONFLICT (slug) DO NOTHING;

-- 6. RPC FUNCTIONS (Robust Implementation)
-- Create Category
CREATE OR REPLACE FUNCTION admin_create_category(
  p_name text,
  p_slug text,
  p_description text,
  p_image text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  INSERT INTO public.categories (name, slug, description, image)
  VALUES (p_name, p_slug, p_description, p_image);
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Update Category
CREATE OR REPLACE FUNCTION admin_update_category(
  p_id uuid,
  p_name text,
  p_slug text,
  p_description text,
  p_image text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  UPDATE public.categories
  SET name=p_name, slug=p_slug, description=p_description, image=p_image, updated_at=now()
  WHERE id=p_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Delete Category
CREATE OR REPLACE FUNCTION admin_delete_category(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  DELETE FROM public.categories WHERE id=p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPCs for Brands (Identical pattern)
CREATE OR REPLACE FUNCTION admin_create_brand(
  p_name text,
  p_slug text,
  p_logo text,
  p_website text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  INSERT INTO public.brands (name, slug, logo, website)
  VALUES (p_name, p_slug, p_logo, p_website);
  
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_brand(
  p_id uuid,
  p_name text,
  p_slug text,
  p_logo text,
  p_website text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  UPDATE public.brands
  SET name=p_name, slug=p_slug, logo=p_logo, website=p_website, updated_at=now()
  WHERE id=p_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_brand(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  DELETE FROM public.brands WHERE id=p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
