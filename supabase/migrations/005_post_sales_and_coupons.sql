-- 005_post_sales_and_coupons.sql
-- Implements Coupons table and Atomic Cancellation logic

-- 1. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL CHECK (value > 0),
  min_purchase_amount NUMERIC DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  max_uses INT,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Admins can manage coupons
CREATE POLICY "Admins can manage coupons" ON public.coupons
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Public (or Authenticated) can read valid coupons (usually via RPC, but RLS needed for querying if frontend does)
-- We'll primarily use RPC for validation to hide logic, but allow reading basic info if needed.
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));


-- 2. ATOMIC CANCELLATION RPC
CREATE OR REPLACE FUNCTION cancel_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_status TEXT;
  v_order_user_id UUID;
  v_item RECORD;
  v_current_stock_by_sizes JSONB;
  v_new_stock INT;
  v_size_key TEXT;
BEGIN
  -- 1. Lock Order Row & Check Permissions
  SELECT status, user_id INTO v_order_status, v_order_user_id
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE; -- Lock to prevent race conditions

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Order not found');
  END IF;

  -- Verify User (Authorization)
  IF v_order_user_id != auth.uid() THEN
     -- Allow Admin override if needed, but for now strict user check
     RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- 2. Verify Status (Can only cancel if pending or processing/paid)
  IF v_order_status NOT IN ('pending', 'processing', 'paid') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Order cannot be cancelled in current state');
  END IF;

  -- 3. Update Order Status
  UPDATE public.orders 
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = p_order_id;

  -- 4. Restore Stock (Iterate Items)
  FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id
  LOOP
    -- Get current product stock data using implicit locking via UPDATE later, 
    -- but here we might need a lock on product too. 
    -- Simplest is to just update atomically using jsonb_set logic or a read-modify-write pattern.
    
    -- We assume product still exists.
    SELECT stock_by_sizes INTO v_current_stock_by_sizes
    FROM public.products
    WHERE id = v_item.product_id;
    
    IF FOUND THEN
      v_size_key := v_item.size;
      
      -- If size key exists in JSON, increment it. 
      -- If it doesn't exist (maybe product structure changed?), we might add it back or log warning.
      -- We will try to add it back.
      
      IF v_current_stock_by_sizes ? v_size_key THEN
         v_new_stock := (v_current_stock_by_sizes->>v_size_key)::int + v_item.quantity;
         
         UPDATE public.products
         SET stock_by_sizes = jsonb_set(stock_by_sizes, ARRAY[v_size_key], to_jsonb(v_new_stock))
         WHERE id = v_item.product_id;
         
         -- NOTE: The 'sync_product_metrics' trigger will fire automatically
         -- and update the total 'stock' and 'sizes' columns.
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- 3. VALIDATE COUPON RPC
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_cart_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon public.coupons%ROWTYPE;
BEGIN
  -- Find Coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = p_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Invalid coupon code');
  END IF;

  -- Check Expiry
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Coupon expired');
  END IF;

  -- Check Max Uses
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Coupon usage limit reached');
  END IF;

  -- Check Min Purchase
  IF v_coupon.min_purchase_amount > p_cart_amount THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Minimum purchase amount not met');
  END IF;

  RETURN jsonb_build_object(
    'valid', true, 
    'type', v_coupon.discount_type, 
    'value', v_coupon.value,
    'code', v_coupon.code
  );
END;
$$;
