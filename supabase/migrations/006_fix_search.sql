-- 006_fix_search.sql

-- 1. Ensure RLS allows public read of products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles; -- Cleanup profile noise too if needed (optional but good)
-- Re-create simple public read
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

-- 2. Create optimized Search RPC
CREATE OR REPLACE FUNCTION search_products(query_text TEXT)
RETURNS SETOF products
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM products
  WHERE 
    name ILIKE '%' || query_text || '%'
    OR description ILIKE '%' || query_text || '%'
    OR category ILIKE '%' || query_text || '%'
    OR brand ILIKE '%' || query_text || '%'
  ORDER BY 
    CASE WHEN name ILIKE query_text || '%' THEN 0 ELSE 1 END, -- Prioritize starts with
    name ASC
  LIMIT 10;
END;
$$;
