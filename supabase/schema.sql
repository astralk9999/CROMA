-- FashionMarket Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price INTEGER NOT NULL, -- Price in cents (e.g., 9900 = €99.00)
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}', -- Array of image URLs from Supabase Storage
  sizes TEXT[] DEFAULT '{}', -- Array of available sizes (e.g., ['S', 'M', 'L', 'XL'])
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access for categories
CREATE POLICY "Public can read categories" 
  ON categories FOR SELECT 
  USING (true);

-- Public read access for products
CREATE POLICY "Public can read products" 
  ON products FOR SELECT 
  USING (true);

-- Only authenticated admins can insert/update/delete categories
CREATE POLICY "Authenticated users can manage categories" 
  ON categories 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Only authenticated admins can insert/update/delete products
CREATE POLICY "Authenticated users can manage products" 
  ON products 
  FOR ALL 
  USING (auth.role() = 'authenticated');

-- Insert default categories
INSERT INTO categories (name, slug) VALUES
  ('Camisas', 'camisas'),
  ('Pantalones', 'pantalones'),
  ('Trajes', 'trajes'),
  ('Accesorios', 'accesorios')
ON CONFLICT (slug) DO NOTHING;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
