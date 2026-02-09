-- REFACTORED ADMIN ACTIONS WITH DETAILED ERROR REPORTING
-- Standardizes all RPCs to return {success: bool, message: text, ...}

-- 1. DELETE PRODUCT
CREATE OR REPLACE FUNCTION admin_delete_product(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;

  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'SESIÓN NO DETECTADA'); END IF;
  IF v_role IS NULL OR v_role != 'admin' THEN 
    RETURN jsonb_build_object('success', false, 'message', 'ACCESO DENEGADO: ROL [' || COALESCE(v_role, 'nulo') || ']'); 
  END IF;

  DELETE FROM public.products WHERE id = p_product_id;
  
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'PRODUCTO NO ENCONTRADO'); END IF;
  
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  -- Check for foreign key constraints (Orders)
  IF SQLSTATE = '23503' THEN
    RETURN jsonb_build_object('success', false, 'message', 'CONSTRAINT_ORDER_ITEMS: PRODUCTO TIENE PEDIDOS ASOCIADOS');
  END IF;
  RETURN jsonb_build_object('success', false, 'message', 'ERROR SQL: ' || SQLERRM);
END;
$$;

-- 2. CREATE PRODUCT (Standardized)
CREATE OR REPLACE FUNCTION admin_create_product(
  p_name text, p_slug text, p_description text, p_price numeric,
  p_category text, p_brand text, p_images text[], p_stock_by_sizes jsonb,
  p_featured boolean, p_sale_price numeric, p_sale_ends_at timestamptz, p_colors text[]
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role text; v_uid uuid; v_new_id uuid;
BEGIN
  v_uid := auth.uid();
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'SESIÓN NO DETECTADA'); END IF;
  IF v_role != 'admin' THEN RETURN jsonb_build_object('success', false, 'message', 'ACCESO DENEGADO'); END IF;

  INSERT INTO public.products (
    name, slug, description, price, category, brand, images, stock_by_sizes, featured, sale_price, sale_ends_at, colors
  ) VALUES (
    p_name, p_slug, p_description, p_price, p_category, p_brand, p_images, p_stock_by_sizes, p_featured, p_sale_price, p_sale_ends_at, p_colors
  ) RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('success', true, 'id', v_new_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR SQL: ' || SQLERRM);
END;
$$;

-- 3. UPDATE PRODUCT (Standardized)
CREATE OR REPLACE FUNCTION admin_update_product(p_product_id uuid, p_updates jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role text; v_uid uuid;
BEGIN
  v_uid := auth.uid();
  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;
  IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'SESIÓN NO DETECTADA'); END IF;
  IF v_role != 'admin' THEN RETURN jsonb_build_object('success', false, 'message', 'ACCESO DENEGADO'); END IF;

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

  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'PRODUCTO NO ENCONTRADO'); END IF;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR SQL: ' || SQLERRM);
END;
$$;
