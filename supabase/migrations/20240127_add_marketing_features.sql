-- Migration: Add Marketing Features to Products
-- Run this in your Supabase SQL Editor

-- =============================================
-- STEP 1: Add missing columns to products table
-- =============================================

-- Limited Drop Feature
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_limited_drop boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS drop_end_date timestamp with time zone;

-- Discount System (replaces legacy sale_price/sale_ends_at)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_active boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_end_date timestamp with time zone;

-- Launch Protocol (rename available_from to launch_date for consistency, or just add alias)
-- We'll keep available_from and add launch_date as an alias via the RPC
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS launch_date timestamp with time zone;

-- Marketing Tags
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_viral_trend boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller boolean DEFAULT false;

-- =============================================
-- STEP 2: Drop and recreate admin_create_product
-- =============================================

DROP FUNCTION IF EXISTS public.admin_create_product(text, text, text, numeric, text, text, text[], jsonb, boolean, numeric, timestamp with time zone, text[]);

CREATE OR REPLACE FUNCTION public.admin_create_product(
  p_name text,
  p_slug text,
  p_description text,
  p_price numeric,
  p_category text,
  p_brand text,
  p_images text[],
  p_stock_by_sizes jsonb,
  p_featured boolean,
  p_colors text[],
  -- New Marketing Fields
  p_is_limited_drop boolean DEFAULT false,
  p_drop_end_date timestamp with time zone DEFAULT NULL,
  p_discount_active boolean DEFAULT false,
  p_discount_percent integer DEFAULT 0,
  p_discount_end_date timestamp with time zone DEFAULT NULL,
  p_launch_date timestamp with time zone DEFAULT NULL,
  p_is_viral_trend boolean DEFAULT false,
  p_is_bestseller boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
  v_new_id uuid;
BEGIN
  -- Admin Check
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  -- Insert Product
  INSERT INTO public.products (
    name, slug, description, price, category, brand, 
    images, stock_by_sizes, featured, colors,
    -- New fields
    is_limited_drop, drop_end_date,
    discount_active, discount_percent, discount_end_date,
    launch_date, available_from, -- Set both for compatibility
    is_viral_trend, is_bestseller
  ) VALUES (
    p_name, p_slug, p_description, p_price, p_category, p_brand, 
    p_images, p_stock_by_sizes, p_featured, p_colors,
    -- New values
    p_is_limited_drop, p_drop_end_date,
    p_discount_active, p_discount_percent, p_discount_end_date,
    p_launch_date, p_launch_date, -- available_from = launch_date
    p_is_viral_trend, p_is_bestseller
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
END;
$$;

-- =============================================
-- STEP 3: Update admin_update_product (jsonb version)
-- =============================================

-- Drop the jsonb version specifically
DROP FUNCTION IF EXISTS public.admin_update_product(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.admin_update_product(p_product_id uuid, p_updates jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Admin Check
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  -- Update Product
  UPDATE public.products
  SET
    name = COALESCE((p_updates->>'name')::text, name),
    slug = COALESCE((p_updates->>'slug')::text, slug),
    description = COALESCE((p_updates->>'description')::text, description),
    price = COALESCE((p_updates->>'price')::numeric, price),
    category = COALESCE((p_updates->>'category')::text, category),
    brand = COALESCE((p_updates->>'brand')::text, brand),
    images = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_updates->'images')), images),
    stock_by_sizes = COALESCE(p_updates->'stock_by_sizes', stock_by_sizes),
    featured = COALESCE((p_updates->>'featured')::boolean, featured),
    colors = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_updates->'colors')), colors),
    -- New Marketing Fields
    is_limited_drop = COALESCE((p_updates->>'is_limited_drop')::boolean, is_limited_drop),
    drop_end_date = COALESCE((p_updates->>'drop_end_date')::timestamptz, drop_end_date),
    discount_active = COALESCE((p_updates->>'discount_active')::boolean, discount_active),
    discount_percent = COALESCE((p_updates->>'discount_percent')::integer, discount_percent),
    discount_end_date = COALESCE((p_updates->>'discount_end_date')::timestamptz, discount_end_date),
    launch_date = COALESCE((p_updates->>'launch_date')::timestamptz, launch_date),
    available_from = COALESCE((p_updates->>'launch_date')::timestamptz, available_from), -- Sync with launch_date
    is_viral_trend = COALESCE((p_updates->>'is_viral_trend')::boolean, is_viral_trend),
    is_bestseller = COALESCE((p_updates->>'is_bestseller')::boolean, is_bestseller),
    updated_at = now()
  WHERE id = p_product_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- =============================================
-- DONE! Verify by checking the products table structure
-- =============================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';
