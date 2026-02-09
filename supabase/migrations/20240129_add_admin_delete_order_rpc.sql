-- Improved Function to Delete Order with better error reporting
CREATE OR REPLACE FUNCTION admin_delete_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_uid uuid;
BEGIN
  -- Get current user ID
  v_uid := auth.uid();
  
  -- Debug role check
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = v_uid;

  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'SESIÓN NO DETECTADA (auth.uid is null)');
  END IF;

  IF v_role IS NULL OR v_role != 'admin' THEN
    RETURN jsonb_build_object(
        'success', false, 
        'message', 'ACCESO DENEGADO: ROL ACTUAL [' || COALESCE(v_role, 'sin perfil') || ']',
        'user_id', v_uid
    );
  END IF;

  -- Attempt deletion
  BEGIN
    DELETE FROM public.orders WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'ORDEN NO ENCONTRADA: ' || p_order_id);
    END IF;

    RETURN jsonb_build_object('success', true);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'FALLO SQL: ' || SQLERRM);
  END;
END;
$$;
