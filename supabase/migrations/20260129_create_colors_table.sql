-- Migration: Create colors table and admin management RPCs
-- Description: Adds a master table for colors and functions to manage them.

-- =====================================================
-- STEP 1: CREATE COLORS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.colors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    slug text UNIQUE NOT NULL,
    hex_code text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access on colors"
ON public.colors FOR SELECT
TO public
USING (true);

-- Admin write access (handled via RPC for consistency, but policy added for safety)
CREATE POLICY "Allow admin full access on colors"
ON public.colors FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- STEP 2: CREATE ADMIN RPC FUNCTIONS
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

-- =====================================================
-- STEP 4: SEED INITIAL COLORS (Based on current sidebar)
-- =====================================================

INSERT INTO public.colors (name, slug, hex_code) 
VALUES 
('BEIGE', 'beige', '#F5F5DC'),
('BLUE', 'blue', '#2563EB'),
('BROWN', 'brown', '#92400E'),
('GOLD', 'gold', '#EAB308'),
('GREEN', 'green', '#16A34A'),
('GREY', 'grey', '#1F2937'),
('ORANGE', 'orange', '#F97316'),
('PINK', 'pink', '#EC4899'),
('RED', 'red', '#DC2626'),
('SILVER', 'silver', '#D1D5DB'),
('VIOLET', 'violet', '#7C3AED'),
('WHITE', 'white', '#FFFFFF'),
('YELLOW', 'yellow', '#FACC15'),
('CARBON BLACK', 'carbon-black', '#111827')
ON CONFLICT (name) DO NOTHING;
