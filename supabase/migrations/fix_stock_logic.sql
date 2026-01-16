-- Migration: Fix Stock Logic and RPCs
-- Ensures stock_by_sizes is the source of truth and total 'stock' is a calculated aggregate.

-- 1. Ensure column exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_by_sizes'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_by_sizes JSONB DEFAULT '{}';
  END IF;
END $$;

-- 2. Update Admin Create Product RPC
-- Calculates total stock from the sizes JSON
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
  p_colors text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
  v_new_id uuid;
  v_total_stock int;
BEGIN
  -- Check admin permission
  SELECT (role = 'admin') INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access Denied: User is not an admin';
  END IF;

  -- Calculate total stock from JSON (sum of all values)
  -- If p_stock_by_sizes is null or empty, total is 0
  SELECT COALESCE(SUM(value::int), 0) INTO v_total_stock
  FROM jsonb_each_text(p_stock_by_sizes);

  -- Insert Product
  INSERT INTO public.products (
    name, slug, description, price, category, brand, 
    images, stock_by_sizes, stock, -- Set both JSON and integer total
    featured, sale_price, sale_ends_at, colors
  ) VALUES (
    p_name, p_slug, p_description, p_price, p_category, p_brand, 
    p_images, p_stock_by_sizes, v_total_stock,
    p_featured, p_sale_price, p_sale_ends_at, p_colors
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
END;
$$;

-- 3. Update Admin Update Product RPC
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
  v_current_stock_by_sizes jsonb;
  v_new_stock_by_sizes jsonb;
  v_new_total_stock int;
BEGIN
  -- Check admin permission
  SELECT (role = 'admin') INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access Denied: User is not an admin';
  END IF;

  -- Logic to sync stock if stock_by_sizes is being updated
  IF (p_updates ? 'stock_by_sizes') THEN
     v_new_stock_by_sizes := p_updates->'stock_by_sizes';
     
     -- Calculate new total
     SELECT COALESCE(SUM(value::int), 0) INTO v_new_total_stock
     FROM jsonb_each_text(v_new_stock_by_sizes);
     
     -- Add calculated stock to updates
     p_updates := jsonb_set(p_updates, '{stock}', to_jsonb(v_new_total_stock));
  END IF;

  -- Perform Update
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
    stock = COALESCE((p_updates->>'stock')::int, stock), -- Updated total
    featured = COALESCE((p_updates->>'featured')::boolean, featured),
    sale_price = COALESCE((p_updates->>'sale_price')::numeric, sale_price),
    sale_ends_at = COALESCE((p_updates->>'sale_ends_at')::timestamptz, sale_ends_at),
    colors = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_updates->'colors')), colors),
    updated_at = now()
  WHERE id = p_product_id;

  IF NOT FOUND THEN
     RAISE EXCEPTION 'Product not found';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
