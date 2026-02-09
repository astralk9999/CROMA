-- Migration: Fix admin_create_product RPC to match frontend parameters
-- This migration ensures the RPC signature matches what the frontend sends
-- including the is_hidden parameter and removing sale_price/sale_ends_at that aren't used

-- =====================================================
-- STEP 1: DROP ALL EXISTING VERSIONS OF BOTH FUNCTIONS
-- =====================================================

-- Drop ALL versions of admin_create_product (different signatures)
DROP FUNCTION IF EXISTS public.admin_create_product(text, text, text, numeric, text, text, text[], jsonb, boolean, numeric, timestamptz, text[]);
DROP FUNCTION IF EXISTS public.admin_create_product(text, text, text, numeric, text, text, text[], jsonb, boolean, numeric, timestamptz, text[], boolean, timestamptz, boolean, integer, timestamptz, timestamptz, boolean, boolean);
DROP FUNCTION IF EXISTS public.admin_create_product(text, text, text, numeric, text, text, text[], jsonb, boolean, text[], boolean, timestamptz, boolean, integer, timestamptz, timestamptz, boolean, boolean);
DROP FUNCTION IF EXISTS public.admin_create_product(text, text, text, numeric, text, text, text[], jsonb, boolean, text[], boolean, timestamptz, boolean, integer, timestamptz, timestamptz, boolean, boolean, boolean);
DROP FUNCTION IF EXISTS public.admin_create_product(text, text, text, numeric, text, text, text[], jsonb, boolean, text[]);
DROP FUNCTION IF EXISTS public.admin_create_product(text, text, text, numeric, text, text, text[], jsonb, boolean, text[], boolean, timestamp with time zone, boolean, integer, timestamp with time zone, timestamp with time zone, boolean, boolean);
DROP FUNCTION IF EXISTS public.admin_create_product(text, text, text, numeric, text, text, text[], jsonb, boolean, text[], boolean, timestamp with time zone, boolean, integer, timestamp with time zone, timestamp with time zone, boolean, boolean, boolean);

-- Drop ALL versions of admin_update_product (different signatures)
DROP FUNCTION IF EXISTS public.admin_update_product(uuid, jsonb);
DROP FUNCTION IF EXISTS public.admin_update_product(uuid);
DROP FUNCTION IF EXISTS public.admin_update_product(p_product_id uuid, p_updates jsonb);

-- Create the corrected function with all parameters the frontend sends
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
  -- Marketing Fields (in order the frontend sends them)
  p_is_limited_drop boolean DEFAULT false,
  p_drop_end_date timestamptz DEFAULT NULL,
  p_discount_active boolean DEFAULT false,
  p_discount_percent integer DEFAULT 0,
  p_discount_end_date timestamptz DEFAULT NULL,
  p_launch_date timestamptz DEFAULT NULL,
  p_is_viral_trend boolean DEFAULT false,
  p_is_bestseller boolean DEFAULT false,
  -- Visibility
  p_is_hidden boolean DEFAULT false
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
  
  IF v_is_admin IS NOT TRUE THEN 
    RETURN jsonb_build_object('success', false, 'message', 'ACCESO DENEGADO: Se requiere rol de administrador');
  END IF;

  -- Insert Product
  INSERT INTO public.products (
    name, slug, description, price, category, brand, 
    images, stock_by_sizes, featured, colors,
    -- Marketing
    is_limited_drop, drop_end_date,
    discount_active, discount_percent, discount_end_date,
    launch_date, available_from,
    is_viral_trend, is_bestseller,
    -- Visibility
    is_hidden
  ) VALUES (
    p_name, p_slug, p_description, p_price, p_category, p_brand, 
    p_images, p_stock_by_sizes, p_featured, p_colors,
    -- Marketing
    p_is_limited_drop, p_drop_end_date,
    p_discount_active, p_discount_percent, p_discount_end_date,
    p_launch_date, p_launch_date,
    p_is_viral_trend, p_is_bestseller,
    -- Visibility
    p_is_hidden
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR SQL: ' || SQLERRM);
END;
$$;

-- Also update admin_update_product to include is_hidden
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
  
  IF v_is_admin IS NOT TRUE THEN 
    RETURN jsonb_build_object('success', false, 'message', 'ACCESO DENEGADO: Se requiere rol de administrador');
  END IF;

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
    -- Marketing Fields
    is_limited_drop = COALESCE((p_updates->>'is_limited_drop')::boolean, is_limited_drop),
    drop_end_date = COALESCE((p_updates->>'drop_end_date')::timestamptz, drop_end_date),
    discount_active = COALESCE((p_updates->>'discount_active')::boolean, discount_active),
    discount_percent = COALESCE((p_updates->>'discount_percent')::integer, discount_percent),
    discount_end_date = COALESCE((p_updates->>'discount_end_date')::timestamptz, discount_end_date),
    launch_date = COALESCE((p_updates->>'launch_date')::timestamptz, launch_date),
    available_from = COALESCE((p_updates->>'launch_date')::timestamptz, available_from),
    is_viral_trend = COALESCE((p_updates->>'is_viral_trend')::boolean, is_viral_trend),
    is_bestseller = COALESCE((p_updates->>'is_bestseller')::boolean, is_bestseller),
    -- Visibility
    is_hidden = COALESCE((p_updates->>'is_hidden')::boolean, is_hidden),
    
    updated_at = now()
  WHERE id = p_product_id;

  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'message', 'PRODUCTO NO ENCONTRADO');
  END IF;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR SQL: ' || SQLERRM);
END;
$$;

-- Ensure the is_hidden column exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_create_product TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_product TO authenticated;
