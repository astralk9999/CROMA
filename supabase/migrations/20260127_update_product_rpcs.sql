-- Migration: Update RPCs for Advanced Product Marketing
-- Description: Updates admin_create_product and admin_update_product to handle new marketing fields.

-- 1. Update admin_create_product
CREATE OR REPLACE FUNCTION admin_create_product(
  p_name text,
  p_slug text,
  p_description text,
  p_price numeric,
  p_category text,
  p_brand text,
  p_images text[],
  p_stock_by_sizes jsonb,
  p_featured boolean,
  p_sale_price numeric,
  p_sale_ends_at timestamptz,
  p_colors text[],
  -- New Fields
  p_is_limited_drop boolean DEFAULT false,
  p_drop_end_date timestamptz DEFAULT null,
  p_discount_active boolean DEFAULT false,
  p_discount_percent integer DEFAULT 0,
  p_discount_end_date timestamptz DEFAULT null,
  p_launch_date timestamptz DEFAULT null,
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
  -- Check if user is admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access Denied: User is not an admin';
  END IF;

  -- Insert Product
  INSERT INTO public.products (
    name, slug, description, price, category, brand, images, stock_by_sizes, featured, sale_price, sale_ends_at, colors,
    is_limited_drop, drop_end_date, discount_active, discount_percent, discount_end_date, launch_date, is_viral_trend, is_bestseller
  ) VALUES (
    p_name, p_slug, p_description, p_price, p_category, p_brand, p_images, p_stock_by_sizes, p_featured, p_sale_price, p_sale_ends_at, p_colors,
    p_is_limited_drop, p_drop_end_date, p_discount_active, p_discount_percent, p_discount_end_date, p_launch_date, p_is_viral_trend, p_is_bestseller
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
END;
$$;

-- 2. Update admin_update_product to handle JSON updates for new fields
CREATE OR REPLACE FUNCTION admin_update_product(
  p_product_id uuid,
  p_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access Denied: User is not an admin';
  END IF;

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
    sale_price = COALESCE((p_updates->>'sale_price')::numeric, sale_price),
    sale_ends_at = COALESCE((p_updates->>'sale_ends_at')::timestamptz, sale_ends_at),
    colors = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_updates->'colors')), colors),
    -- New Fields Updates
    is_limited_drop = COALESCE((p_updates->>'is_limited_drop')::boolean, is_limited_drop),
    drop_end_date = COALESCE((p_updates->>'drop_end_date')::timestamptz, drop_end_date),
    discount_active = COALESCE((p_updates->>'discount_active')::boolean, discount_active),
    discount_percent = COALESCE((p_updates->>'discount_percent')::integer, discount_percent),
    discount_end_date = COALESCE((p_updates->>'discount_end_date')::timestamptz, discount_end_date),
    launch_date = COALESCE((p_updates->>'launch_date')::timestamptz, launch_date),
    is_viral_trend = COALESCE((p_updates->>'is_viral_trend')::boolean, is_viral_trend),
    is_bestseller = COALESCE((p_updates->>'is_bestseller')::boolean, is_bestseller),
    updated_at = now()
  WHERE id = p_product_id;

  IF NOT FOUND THEN
     RAISE EXCEPTION 'Product not found';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
