-- Migration: Add tags column and improved search RPC
-- Description: Adds tags support and a more robust search function including colors and tags.

-- 1. Add tags column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'tags'
  ) THEN
    ALTER TABLE products ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- 2. Create optimized Search RPC v2
CREATE OR REPLACE FUNCTION public.search_products_v2(query_text TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    price DECIMAL,
    images TEXT[],
    category TEXT,
    brand TEXT,
    colors TEXT[],
    tags TEXT[],
    category_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.slug, p.description, p.price, p.images, 
        p.category, p.brand, p.colors, p.tags,
        c.name as category_name
    FROM public.products p
    LEFT JOIN public.categories c ON p.category = c.slug
    WHERE 
        p.name ILIKE '%' || query_text || '%'
        OR p.description ILIKE '%' || query_text || '%'
        OR p.category ILIKE '%' || query_text || '%'
        OR p.brand ILIKE '%' || query_text || '%'
        OR query_text = ANY(p.colors)
        OR query_text = ANY(p.tags)
        OR array_to_string(p.colors, ' ') ILIKE '%' || query_text || '%'
        OR array_to_string(p.tags, ' ') ILIKE '%' || query_text || '%'
    ORDER BY 
        CASE 
            WHEN p.name ILIKE query_text || '%' THEN 0 
            WHEN p.name ILIKE '%' || query_text || '%' THEN 1
            ELSE 2 
        END,
        p.name ASC
    LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_products_v2 TO anon, authenticated;
