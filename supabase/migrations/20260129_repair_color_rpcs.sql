-- Migration: Repair Color Management RPCs
-- Description: Drops and recreates Color RPCs with correct signatures to ensure cache matches frontend calls.

-- =====================================================
-- STEP 1: DROP ALL POTENTIAL VERSIONS
-- =====================================================

-- Drop create functions
DROP FUNCTION IF EXISTS public.admin_create_color(text, text);
DROP FUNCTION IF EXISTS public.admin_create_color(text, text, text);

-- Drop update functions
DROP FUNCTION IF EXISTS public.admin_update_color(uuid, text, text);
DROP FUNCTION IF EXISTS public.admin_update_color(uuid, text, text, text);

-- Drop delete functions
DROP FUNCTION IF EXISTS public.admin_delete_color(uuid);

-- =====================================================
-- STEP 2: RECREATE WITH UNIFORM SIGNATURES 
-- =====================================================

-- 2.1 CREATE COLOR
CREATE OR REPLACE FUNCTION public.admin_create_color(
  p_name text,
  p_slug text,
  p_hex_code text DEFAULT NULL
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

  -- Insert Color
  INSERT INTO public.colors (name, slug, hex_code)
  VALUES (p_name, p_slug, p_hex_code)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR: Ya existe un color con ese nombre o slug');
WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR SQL: ' || SQLERRM);
END;
$$;

-- 2.2 UPDATE COLOR
CREATE OR REPLACE FUNCTION public.admin_update_color(
  p_id uuid,
  p_name text,
  p_slug text,
  p_hex_code text DEFAULT NULL
)
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

  -- Update Color
  UPDATE public.colors
  SET
    name = p_name,
    slug = p_slug,
    hex_code = p_hex_code,
    updated_at = now()
  WHERE id = p_id;

  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'message', 'COLOR NO ENCONTRADO');
  END IF;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR: Ya existe un color con ese nombre o slug');
WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR SQL: ' || SQLERRM);
END;
$$;

-- 2.3 DELETE COLOR
CREATE OR REPLACE FUNCTION public.admin_delete_color(p_id uuid)
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

  -- Delete Color
  DELETE FROM public.colors WHERE id = p_id;

  IF NOT FOUND THEN 
    RETURN jsonb_build_object('success', false, 'message', 'COLOR NO ENCONTRADO');
  END IF;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR SQL: ' || SQLERRM);
END;
$$;

-- =====================================================
-- STEP 3: GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.admin_create_color TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_color TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_color TO authenticated;
