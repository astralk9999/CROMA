-- RPC FUNCTIONS FOR ROBUST ADMIN ACTIONS
-- These functions bypass Table RLS policies by running as SECURITY DEFINER (System permissions).
-- Logic checks permissions internally.

-- 1. Function to Create Product
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
SECURITY DEFINER -- Bypasses RLS
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
    name, slug, description, price, category, brand, images, stock_by_sizes, featured, sale_price, sale_ends_at, colors
  ) VALUES (
    p_name, p_slug, p_description, p_price, p_category, p_brand, p_images, p_stock_by_sizes, p_featured, p_sale_price, p_sale_ends_at, p_colors
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
END;
$$;

-- 2. Function to Update Product
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

  -- Update Product
  -- Note: We use jsonb_populate_record or explicit updates. 
  -- For simplicity in this specialized function, we assume matching columns or do explicit mapping if needed.
  -- To handle dynamic updates flexibly without dynamic SQL, we just expect the client to use the standard Table API? 
  -- NO, the whole point is RLS is broken. We must perform the update here.
  -- Simplified: We only support updating the common fields.
  
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
    updated_at = now()
  WHERE id = p_product_id;

  IF NOT FOUND THEN
     RAISE EXCEPTION 'Product not found';
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. Function to Delete Product
CREATE OR REPLACE FUNCTION admin_delete_product(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access Denied: User is not an admin';
  END IF;

  DELETE FROM public.products WHERE id = p_product_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Function to Update Own Profile (Robust Fix)
CREATE OR REPLACE FUNCTION update_own_profile(
    p_full_name text,
    p_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    full_name = p_full_name,
    phone = p_phone,
    updated_at = now()
  WHERE id = auth.uid();

  IF NOT FOUND THEN
     -- Auto-fix: Create profile if missing
     INSERT INTO public.profiles (id, email, full_name, phone, role)
     SELECT auth.uid(), auth.email(), p_full_name, p_phone, 'customer'
     FROM auth.users
     WHERE id = auth.uid();
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
