-- Migration: increment_coupon_usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE coupons
    SET uses = COALESCE(uses, 0) + 1
    WHERE code = p_code;
END;
$$;
