-- 007_atomic_stock.sql

-- 1. Atomic Decrement RPC
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_size TEXT, p_quantity INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INT;
BEGIN
  -- Check current stock for the specific size
  SELECT (stock_by_sizes->>p_size)::int INTO v_current_stock
  FROM products
  WHERE id = p_product_id;

  IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
     RETURN jsonb_build_object('success', false, 'message', 'Insufficient stock');
  END IF;

  -- Decrement atomically
  UPDATE products
  SET stock_by_sizes = jsonb_set(stock_by_sizes, ARRAY[p_size], to_jsonb(v_current_stock - p_quantity))
  WHERE id = p_product_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 2. Restore Stock Helper (For Cancellation/Expiration)
CREATE OR REPLACE FUNCTION restore_stock(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_current_stock INT;
BEGIN
  -- Iterate items
  FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id
  LOOP
    -- Get current stock
    SELECT (stock_by_sizes->>v_item.size)::int INTO v_current_stock
    FROM products
    WHERE id = v_item.product_id;

    IF v_current_stock IS NULL THEN v_current_stock := 0; END IF;

    -- Increment
    UPDATE products
    SET stock_by_sizes = jsonb_set(stock_by_sizes, ARRAY[v_item.size], to_jsonb(v_current_stock + v_item.quantity))
    WHERE id = v_item.product_id;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;
