-- Add Sale/Drop features to products table
DO $$ 
BEGIN
  -- Add sale_price column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE products ADD COLUMN sale_price DECIMAL(10,2);
  END IF;

  -- Add sale_ends_at column for "Drops" / Limited Time Offers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sale_ends_at'
  ) THEN
    ALTER TABLE products ADD COLUMN sale_ends_at TIMESTAMPTZ;
  END IF;
END $$;
