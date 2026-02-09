-- 20260209_coupon_admin_rpcs.sql
-- Admin RPCs for coupon management

-- 1. CREATE COUPON
CREATE OR REPLACE FUNCTION admin_create_coupon(
    p_code TEXT,
    p_discount_type TEXT,
    p_value NUMERIC,
    p_min_purchase_amount NUMERIC DEFAULT 0,
    p_starts_at TIMESTAMPTZ DEFAULT NOW(),
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_max_uses INT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_id UUID;
BEGIN
    -- Check if admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin access required');
    END IF;

    -- Validate discount_type
    IF p_discount_type NOT IN ('percentage', 'fixed') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid discount type. Must be "percentage" or "fixed"');
    END IF;

    -- Check for duplicate code
    IF EXISTS (SELECT 1 FROM coupons WHERE LOWER(code) = LOWER(p_code)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'A coupon with this code already exists');
    END IF;

    -- Insert coupon
    INSERT INTO coupons (code, discount_type, value, min_purchase_amount, starts_at, expires_at, max_uses, is_active)
    VALUES (UPPER(p_code), p_discount_type, p_value, p_min_purchase_amount, p_starts_at, p_expires_at, p_max_uses, p_is_active)
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'id', v_new_id);
END;
$$;


-- 2. UPDATE COUPON
CREATE OR REPLACE FUNCTION admin_update_coupon(
    p_id UUID,
    p_code TEXT,
    p_discount_type TEXT,
    p_value NUMERIC,
    p_min_purchase_amount NUMERIC DEFAULT 0,
    p_starts_at TIMESTAMPTZ DEFAULT NOW(),
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_max_uses INT DEFAULT NULL,
    p_is_active BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin access required');
    END IF;

    -- Validate discount_type
    IF p_discount_type NOT IN ('percentage', 'fixed') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid discount type. Must be "percentage" or "fixed"');
    END IF;

    -- Check for duplicate code (excluding current coupon)
    IF EXISTS (SELECT 1 FROM coupons WHERE LOWER(code) = LOWER(p_code) AND id != p_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'A coupon with this code already exists');
    END IF;

    -- Update coupon
    UPDATE coupons
    SET 
        code = UPPER(p_code),
        discount_type = p_discount_type,
        value = p_value,
        min_purchase_amount = p_min_purchase_amount,
        starts_at = p_starts_at,
        expires_at = p_expires_at,
        max_uses = p_max_uses,
        is_active = p_is_active
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Coupon not found');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;


-- 3. DELETE COUPON
CREATE OR REPLACE FUNCTION admin_delete_coupon(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin access required');
    END IF;

    DELETE FROM coupons WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Coupon not found');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;


-- 4. TOGGLE COUPON ACTIVE STATUS
CREATE OR REPLACE FUNCTION admin_toggle_coupon(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_status BOOLEAN;
BEGIN
    -- Check if admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized: Admin access required');
    END IF;

    UPDATE coupons
    SET is_active = NOT is_active
    WHERE id = p_id
    RETURNING is_active INTO v_new_status;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Coupon not found');
    END IF;

    RETURN jsonb_build_object('success', true, 'is_active', v_new_status);
END;
$$;
