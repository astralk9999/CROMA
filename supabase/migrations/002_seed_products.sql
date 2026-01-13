-- CROMA Store Seed Data
-- Run this in Supabase SQL Editor AFTER the schema migration

-- ============================================
-- Clear existing products if needed (optional - uncomment to reset)
-- ============================================
-- DELETE FROM products;

-- ============================================
-- Insert Categories
-- ============================================
INSERT INTO categories (name, slug) VALUES
  ('Jackets', 'jackets'),
  ('Sweatshirt / Pullover', 'sweatshirt-pullover'),
  ('T-Shirts', 't-shirts'),
  ('Trousers', 'trousers'),
  ('Denim', 'denim'),
  ('Shirts', 'shirts'),
  ('Accessories', 'accessories'),
  ('Underwear & Socks', 'underwear-and-socks'),
  ('Sportswear', 'sportswear'),
  ('Shoes', 'shoes')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- ============================================
-- Insert Sample Products
-- ============================================

-- JACKETS
INSERT INTO products (name, slug, description, price, stock, category, brand, colors, images, stock_by_sizes, featured) VALUES
(
  'Urban Bomber Jacket',
  'urban-bomber-jacket',
  'Classic bomber jacket with modern urban styling. Premium quality materials.',
  119.99,
  15,
  'jackets',
  'black-squad',
  ARRAY['black', 'green'],
  ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 3, "M": 5, "L": 4, "XL": 3}'::jsonb,
  true
),
(
  'Denim Trucker Jacket',
  'denim-trucker-jacket',
  'Timeless denim jacket with vintage wash finish.',
  89.99,
  8,
  'jackets',
  'smog',
  ARRAY['blue'],
  ARRAY['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 2, "M": 3, "L": 2, "XL": 1}'::jsonb,
  false
),
(
  'Puffer Winter Coat',
  'puffer-winter-coat',
  'Warm and stylish puffer coat for cold weather.',
  159.99,
  20,
  'jackets',
  'iq',
  ARRAY['orange', 'red'],
  ARRAY['https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 4, "M": 6, "L": 6, "XL": 4}'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- SWEATSHIRTS
INSERT INTO products (name, slug, description, price, stock, category, brand, colors, images, stock_by_sizes, featured) VALUES
(
  'Oversized Street Hoodie',
  'oversized-street-hoodie',
  'Comfortable oversized hoodie perfect for street style.',
  69.99,
  20,
  'sweatshirt-pullover',
  'fsbn',
  ARRAY['grey-black', 'white'],
  ARRAY['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 4, "M": 6, "L": 6, "XL": 4}'::jsonb,
  true
),
(
  'Graphic Pullover',
  'graphic-pullover',
  'Bold graphic pullover with urban design.',
  54.99,
  35,
  'sweatshirt-pullover',
  'black-squad',
  ARRAY['black', 'yellow'],
  ARRAY['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 8, "M": 10, "L": 10, "XL": 7}'::jsonb,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- T-SHIRTS
INSERT INTO products (name, slug, description, price, stock, category, brand, colors, images, stock_by_sizes, featured) VALUES
(
  'Essential White Tee',
  'essential-white-tee',
  'Premium cotton essential tee for everyday wear.',
  29.99,
  50,
  't-shirts',
  'smog',
  ARRAY['white'],
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 12, "M": 15, "L": 13, "XL": 10}'::jsonb,
  false
),
(
  'Vintage Wash Tee',
  'vintage-wash-tee',
  'Vintage style t-shirt with unique wash effect.',
  34.99,
  40,
  't-shirts',
  'fsbn',
  ARRAY['grey-black', 'blue'],
  ARRAY['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 10, "M": 12, "L": 10, "XL": 8}'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- DENIM & TROUSERS
INSERT INTO products (name, slug, description, price, stock, category, brand, colors, images, stock_by_sizes, featured) VALUES
(
  'Distressed Denim Jeans',
  'distressed-denim-jeans',
  'Stylish distressed jeans with modern fit.',
  79.99,
  12,
  'denim',
  'black-squad',
  ARRAY['blue'],
  ARRAY['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'],
  '{"30": 3, "32": 4, "34": 3, "36": 2}'::jsonb,
  false
),
(
  'Cargo Utility Pants',
  'cargo-utility-pants',
  'Functional cargo pants with multiple pockets.',
  74.99,
  18,
  'trousers',
  'smog',
  ARRAY['green', 'beige'],
  ARRAY['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?q=80&w=1000&auto=format&fit=crop'],
  '{"30": 4, "32": 6, "34": 5, "36": 3}'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- SHOES
INSERT INTO products (name, slug, description, price, stock, category, brand, colors, images, stock_by_sizes, featured) VALUES
(
  'Canvas High Tops',
  'canvas-high-tops',
  'Classic high-top sneakers for urban style.',
  64.99,
  30,
  'shoes',
  'iq',
  ARRAY['black', 'white'],
  ARRAY['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1000&auto=format&fit=crop'],
  '{"40": 6, "41": 8, "42": 8, "43": 5, "44": 3}'::jsonb,
  true
),
(
  'Performance Runners',
  'performance-runners',
  'High-performance running shoes for active lifestyle.',
  99.99,
  8,
  'sportswear',
  'lucky-athletes',
  ARRAY['red', 'white'],
  ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop'],
  '{"40": 2, "41": 2, "42": 2, "43": 1, "44": 1}'::jsonb,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- SHIRTS
INSERT INTO products (name, slug, description, price, stock, category, brand, colors, images, stock_by_sizes, featured) VALUES
(
  'Oxford Casual Shirt',
  'oxford-casual-shirt',
  'Classic oxford shirt for smart casual looks.',
  54.99,
  22,
  'shirts',
  'smog',
  ARRAY['blue', 'white'],
  ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 5, "M": 7, "L": 6, "XL": 4}'::jsonb,
  false
),
(
  'Flannel Check Shirt',
  'flannel-check-shirt',
  'Warm flannel shirt with classic check pattern.',
  49.99,
  18,
  'shirts',
  'fsbn',
  ARRAY['red', 'black'],
  ARRAY['https://images.unsplash.com/photo-1576566582149-4347729df66f?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 4, "M": 6, "L": 5, "XL": 3}'::jsonb,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- ACCESSORIES
INSERT INTO products (name, slug, description, price, stock, category, brand, colors, images, stock_by_sizes, featured) VALUES
(
  'Retro Sunglasses',
  'retro-sunglasses',
  'Stylish retro-inspired sunglasses for any outfit.',
  29.99,
  45,
  'accessories',
  'icono',
  ARRAY['black', 'gold'],
  ARRAY['https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1000&auto=format&fit=crop'],
  '{"One Size": 45}'::jsonb,
  false
),
(
  'Beanie Hat',
  'beanie-hat',
  'Warm and stylish beanie for cold days.',
  19.99,
  100,
  'accessories',
  'fsbn',
  ARRAY['grey-black', 'blue'],
  ARRAY['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=1000&auto=format&fit=crop'],
  '{"One Size": 100}'::jsonb,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- UNDERWEAR & SOCKS
INSERT INTO products (name, slug, description, price, stock, category, brand, colors, images, stock_by_sizes, featured) VALUES
(
  'Sport Socks Pack',
  'sport-socks-pack',
  'Premium sport socks pack for active lifestyle.',
  16.99,
  200,
  'underwear-and-socks',
  'lucky-athletes',
  ARRAY['white', 'black'],
  ARRAY['https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 50, "M": 70, "L": 50, "XL": 30}'::jsonb,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- SPORTSWEAR
INSERT INTO products (name, slug, description, price, stock, category, brand, colors, images, stock_by_sizes, featured) VALUES
(
  'Training Track Jacket',
  'training-track-jacket',
  'Performance track jacket for training and casual wear.',
  64.99,
  25,
  'sportswear',
  'lucky-athletes',
  ARRAY['blue', 'black'],
  ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'],
  '{"S": 6, "M": 8, "L": 7, "XL": 4}'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Verify insertion
-- ============================================
DO $$ 
DECLARE
  product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  RAISE NOTICE 'Total products in database: %', product_count;
END $$;
