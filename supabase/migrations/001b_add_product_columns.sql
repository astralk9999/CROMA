-- Add missing columns to products table for CROMA store
-- Run this BEFORE the seed data migration

-- Add category column (slug-based for easier querying)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    ALTER TABLE products ADD COLUMN category TEXT;
  END IF;
END $$;

-- Add brand column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'brand'
  ) THEN
    ALTER TABLE products ADD COLUMN brand TEXT;
  END IF;
END $$;

-- Add colors array column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'colors'
  ) THEN
    ALTER TABLE products ADD COLUMN colors TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Add stock_by_sizes JSONB column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_by_sizes'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_by_sizes JSONB DEFAULT '{}';
  END IF;
END $$;

-- Modify price column to DECIMAL if it's INTEGER
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'price' AND data_type = 'integer'
  ) THEN
    ALTER TABLE products ALTER COLUMN price TYPE DECIMAL(10,2) USING price::DECIMAL(10,2) / 100;
  END IF;
END $$;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- Verify columns exist
DO $$
BEGIN
  RAISE NOTICE 'Products table columns updated successfully!';
  RAISE NOTICE 'You can now run the seed data migration (002_seed_products.sql)';
END $$;
