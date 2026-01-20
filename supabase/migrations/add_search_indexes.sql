-- add_search_indexes.sql
-- Optimización de búsqueda para CROMA

-- 1. Habilitar extensión pg_trgm si no existe (necesaria para ILIKE rápido)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Añadir índices GIN trgm para búsqueda de texto
-- Nota: Ya existen índices GIN para 'name' y 'description' en migraciones previas (006_fix_search.sql o fix_recursion_and_search.sql)
-- pero nos faltan para 'category' y 'brand' que se usan mucho en el widget.

CREATE INDEX IF NOT EXISTS idx_products_category_trgm ON public.products USING gin (category gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON public.products USING gin (brand gin_trgm_ops);

-- 3. Índice para el slug (para búsquedas exactas/navegación)
CREATE INDEX IF NOT EXISTS idx_products_slug_v2 ON public.products(slug);

-- 4. Re-verificar los índices principales de búsqueda por si no están
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON public.products USING gin (description gin_trgm_ops);
