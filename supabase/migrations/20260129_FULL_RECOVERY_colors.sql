-- Migration: Full Protocol Recovery - Colors System
-- Description: Ensures the table exists and all RPCs are correctly synchronized.

-- =====================================================
-- STEP 1: DATABASE STRUCTURE
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
DROP POLICY IF EXISTS "Allow public read access on colors" ON public.colors;
CREATE POLICY "Allow public read access on colors"
ON public.colors FOR SELECT
TO public
USING (true);

-- Admin write access
DROP POLICY IF EXISTS "Allow admin full access on colors" ON public.colors;
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
-- STEP 2: RPC REPAIR (Drop & Recreate)
-- =====================================================

-- Drop all possible versions to avoid signature mismatches
DROP FUNCTION IF EXISTS public.admin_create_color(text, text);
DROP FUNCTION IF EXISTS public.admin_create_color(text, text, text);
DROP FUNCTION IF EXISTS public.admin_update_color(uuid, text, text);
DROP FUNCTION IF EXISTS public.admin_update_color(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.admin_delete_color(uuid);

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
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN 
    RETURN jsonb_build_object('success', false, 'message', 'ACCESO DENEGADO');
  END IF;

  INSERT INTO public.colors (name, slug, hex_code)
  VALUES (p_name, p_slug, p_hex_code)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('id', v_new_id, 'success', true);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR: Registro duplicado detectado');
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
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN 
    RETURN jsonb_build_object('success', false, 'message', 'ACCESO DENEGADO');
  END IF;

  UPDATE public.colors
  SET name = p_name, slug = p_slug, hex_code = p_hex_code, updated_at = now()
  WHERE id = p_id;

  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'NO ENCONTRADO'); END IF;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR: Registro duplicado detectado');
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
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN 
    RETURN jsonb_build_object('success', false, 'message', 'ACCESO DENEGADO');
  END IF;

  DELETE FROM public.colors WHERE id = p_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'NO ENCONTRADO'); END IF;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', 'ERROR SQL: ' || SQLERRM);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_create_color TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_color TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_color TO authenticated;

-- =====================================================
-- STEP 3: SEED INITIAL DATA
-- =====================================================

INSERT INTO public.colors (name, slug, hex_code) 
VALUES 
('BEIGE', 'beige', '#F5F5DC'),
('CARBON BLACK', 'carbon-black', '#111827'),
('WHITE', 'white', '#FFFFFF')
ON CONFLICT (name) DO NOTHING;
