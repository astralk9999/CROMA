-- Migration: Add available_from field for Drops (product launches)
-- Run this in your Supabase SQL Editor

-- Add available_from column for scheduled product releases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'available_from'
  ) THEN
    ALTER TABLE products ADD COLUMN available_from TIMESTAMPTZ;
  END IF;
END $$;

-- Create index for faster querying of upcoming drops
CREATE INDEX IF NOT EXISTS idx_products_available_from ON products(available_from);

-- Create a view for upcoming drops (products not yet available)
CREATE OR REPLACE VIEW upcoming_drops AS
SELECT * FROM products
WHERE available_from IS NOT NULL 
  AND available_from > NOW()
ORDER BY available_from ASC;

-- Create a view for recent drops (products released in the last 7 days)
CREATE OR REPLACE VIEW recent_drops AS
SELECT * FROM products
WHERE available_from IS NOT NULL 
  AND available_from <= NOW()
  AND available_from >= NOW() - INTERVAL '7 days'
ORDER BY available_from DESC;

-- Add RPC function to check if a product is available for purchase
CREATE OR REPLACE FUNCTION is_product_available(p_product_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_from TIMESTAMPTZ;
BEGIN
  SELECT available_from INTO v_available_from
  FROM products
  WHERE id = p_product_id;
  
  -- If no available_from date, product is available
  IF v_available_from IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Product is available if current time is past available_from
  RETURN NOW() >= v_available_from;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin_update_product RPC to include available_from
-- First check if the function exists and update it
CREATE OR REPLACE FUNCTION admin_update_product(
  p_product_id UUID,
  p_name TEXT DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_price DECIMAL DEFAULT NULL,
  p_images TEXT[] DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_brand TEXT DEFAULT NULL,
  p_colors TEXT[] DEFAULT NULL,
  p_sizes TEXT[] DEFAULT NULL,
  p_stock_by_sizes JSONB DEFAULT NULL,
  p_featured BOOLEAN DEFAULT NULL,
  p_available_from TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE products SET
    name = COALESCE(p_name, name),
    slug = COALESCE(p_slug, slug),
    description = COALESCE(p_description, description),
    price = COALESCE(p_price, price),
    images = COALESCE(p_images, images),
    category = COALESCE(p_category, category),
    brand = COALESCE(p_brand, brand),
    colors = COALESCE(p_colors, colors),
    sizes = COALESCE(p_sizes, sizes),
    stock_by_sizes = COALESCE(p_stock_by_sizes, stock_by_sizes),
    featured = COALESCE(p_featured, featured),
    available_from = COALESCE(p_available_from, available_from),
    updated_at = NOW()
  WHERE id = p_product_id;
  
  SELECT row_to_json(p) INTO v_result 
  FROM products p 
  WHERE id = p_product_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Drops feature migration completed successfully!';
  RAISE NOTICE 'New features:';
  RAISE NOTICE '  - available_from column on products table';
  RAISE NOTICE '  - upcoming_drops view for unreleased products';
  RAISE NOTICE '  - recent_drops view for newly released products';
  RAISE NOTICE '  - is_product_available() function to check availability';
  RAISE NOTICE '  - admin_update_product now accepts available_from parameter';
END $$;
