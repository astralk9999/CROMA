-- OPTIMIZE SCHEMA: STRICT STOCK & ONE SIZE SUPPORT
-- This migration enforces data integrity and removes the need for manual stock calculation.

-- 1. Create Function to Sync Metrics (Trigger Logic)
CREATE OR REPLACE FUNCTION public.sync_product_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_total_stock int := 0;
  v_sizes text[] := '{}';
  v_key text;
  v_value jsonb;
BEGIN
  -- If stock_by_sizes is null, set defaults
  IF NEW.stock_by_sizes IS NULL THEN
    NEW.stock := 0;
    NEW.sizes := '{}';
    RETURN NEW;
  END IF;

  -- Verify it is an object
  IF jsonb_typeof(NEW.stock_by_sizes) != 'object' THEN
     RAISE EXCEPTION 'stock_by_sizes must be a JSON object';
  END IF;

  -- Iterate over keys to sum stock and build sizes array
  FOR v_key, v_value IN SELECT * FROM jsonb_each(NEW.stock_by_sizes)
  LOOP
    -- Validate value is a positive integer
    IF jsonb_typeof(v_value) != 'number' OR v_value::int < 0 THEN
       RAISE EXCEPTION 'Stock value for size % must be a non-negative integer', v_key;
    END IF;

    -- Add to total (only if > 0)
    v_total_stock := v_total_stock + v_value::int;

    -- Add to sizes array (only if > 0) - This auto-hides sizes with 0 stock
    IF v_value::int > 0 THEN
        v_sizes := array_append(v_sizes, v_key);
    END IF;
  END LOOP;

  -- Set calculated values (Override any manual input)
  NEW.stock := v_total_stock;
  
  -- For One Size products ('TU', 'OS', 'ONE SIZE'), we might strictly want to keep the key in keys
  -- Logic: If the JSON has keys with > 0 stock, those are the available sizes.
  NEW.sizes := v_sizes;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach Trigger to Products Table
DROP TRIGGER IF EXISTS trg_sync_product_metrics ON public.products;
CREATE TRIGGER trg_sync_product_metrics
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_metrics();

-- 3. Update Existing Data (Batch Process)
-- This forces the trigger to run for all rows, fixing any inconsistencies immediately.
UPDATE public.products SET id = id;

-- 4. Simplify RPCs (Now they rely on the Trigger)
-- Admin Create
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
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  -- We do NOT pass stock or sizes manually. The Trigger does it.
  INSERT INTO public.products (
    name, slug, description, price, category, brand, 
    images, stock_by_sizes, 
    featured, sale_price, sale_ends_at, colors
  ) VALUES (
    p_name, p_slug, p_description, p_price, p_category, p_brand, 
    p_images, p_stock_by_sizes,
    p_featured, p_sale_price, p_sale_ends_at, p_colors
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
END;
$$;

-- Admin Update
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
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN RAISE EXCEPTION 'Access Denied'; END IF;

  -- We update fields. If stock_by_sizes is updated, the trigger recalculates stock/sizes.
  -- Only update columns that are present in the JSON
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
    -- stock and sizes are IGNORED here because the trigger sets them
    featured = COALESCE((p_updates->>'featured')::boolean, featured),
    sale_price = COALESCE((p_updates->>'sale_price')::numeric, sale_price),
    sale_ends_at = COALESCE((p_updates->>'sale_ends_at')::timestamptz, sale_ends_at),
    colors = COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_updates->'colors')), colors),
    updated_at = now()
  WHERE id = p_product_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
