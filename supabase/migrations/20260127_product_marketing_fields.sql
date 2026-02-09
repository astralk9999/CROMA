-- Migration: Add Advanced Product Marketing Fields
-- Description: Adds support for Limited Drops, Time-based Discounts, Upcoming Launches, and Manual Trends/Bestsellers.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_limited_drop BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS drop_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS discount_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_percent INTEGER CHECK (discount_percent >= 0 AND discount_percent <= 100),
ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS launch_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_viral_trend BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;

-- Add comment to explain fields
COMMENT ON COLUMN products.is_limited_drop IS 'If true, product is a limited time drop';
COMMENT ON COLUMN products.drop_end_date IS 'When the limited drop ends';
COMMENT ON COLUMN products.discount_active IS 'If true, a discount is applied';
COMMENT ON COLUMN products.discount_percent IS 'Percentage to deduct from price';
COMMENT ON COLUMN products.discount_end_date IS 'When the discount expires (null for indefinite)';
COMMENT ON COLUMN products.launch_date IS 'If set, product is upcoming and cannot be bought until this date';
COMMENT ON COLUMN products.is_viral_trend IS 'Manual override to appear in Viral Trends';
COMMENT ON COLUMN products.is_bestseller IS 'Manual override to appear in Bestsellers';
