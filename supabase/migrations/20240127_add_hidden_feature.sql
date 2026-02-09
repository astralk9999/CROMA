-- Add is_hidden column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Update admin_create_product function
CREATE OR REPLACE FUNCTION public.admin_create_product(
    p_name TEXT,
    p_slug TEXT,
    p_description TEXT,
    p_price DECIMAL,
    p_category TEXT,
    p_brand TEXT,
    p_images TEXT[],
    p_stock_by_sizes JSONB,
    p_featured BOOLEAN,
    p_colors TEXT[],
    p_is_limited_drop BOOLEAN DEFAULT FALSE,
    p_drop_end_date TIMESTAMPTZ DEFAULT NULL,
    p_discount_active BOOLEAN DEFAULT FALSE,
    p_discount_percent INTEGER DEFAULT 0,
    p_discount_end_date TIMESTAMPTZ DEFAULT NULL,
    p_launch_date TIMESTAMPTZ DEFAULT NULL,
    p_is_viral_trend BOOLEAN DEFAULT FALSE,
    p_is_bestseller BOOLEAN DEFAULT FALSE,
    p_is_hidden BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_id UUID;
BEGIN
    INSERT INTO public.products (
        name, slug, description, price, category, brand, images, stock_by_sizes, 
        featured, colors, is_limited_drop, drop_end_date, discount_active, 
        discount_percent, discount_end_date, launch_date, is_viral_trend, is_bestseller, is_hidden
    ) VALUES (
        p_name, p_slug, p_description, p_price, p_category, p_brand, p_images, p_stock_by_sizes,
        p_featured, p_colors, p_is_limited_drop, p_drop_end_date, p_discount_active,
        p_discount_percent, p_discount_end_date, p_launch_date, p_is_viral_trend, p_is_bestseller, p_is_hidden
    ) RETURNING id INTO v_product_id;

    RETURN jsonb_build_object('id', v_product_id, 'success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update admin_update_product function
CREATE OR REPLACE FUNCTION public.admin_update_product(
    p_product_id UUID,
    p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.products
    SET 
        name = COALESCE((p_updates->>'name')::TEXT, name),
        slug = COALESCE((p_updates->>'slug')::TEXT, slug),
        description = COALESCE((p_updates->>'description')::TEXT, description),
        price = COALESCE((p_updates->>'price')::DECIMAL, price),
        category = COALESCE((p_updates->>'category')::TEXT, category),
        brand = COALESCE((p_updates->>'brand')::TEXT, brand),
        images = COALESCE((p_updates->>'images')::TEXT[], images),
        stock_by_sizes = COALESCE((p_updates->>'stock_by_sizes')::JSONB, stock_by_sizes),
        featured = COALESCE((p_updates->>'featured')::BOOLEAN, featured),
        colors = COALESCE((p_updates->>'colors')::TEXT[], colors),
        is_limited_drop = COALESCE((p_updates->>'is_limited_drop')::BOOLEAN, is_limited_drop),
        drop_end_date = COALESCE((p_updates->>'drop_end_date')::TIMESTAMPTZ, drop_end_date),
        discount_active = COALESCE((p_updates->>'discount_active')::BOOLEAN, discount_active),
        discount_percent = COALESCE((p_updates->>'discount_percent')::INTEGER, discount_percent),
        discount_end_date = COALESCE((p_updates->>'discount_end_date')::TIMESTAMPTZ, discount_end_date),
        launch_date = COALESCE((p_updates->>'launch_date')::TIMESTAMPTZ, launch_date),
        is_viral_trend = COALESCE((p_updates->>'is_viral_trend')::BOOLEAN, is_viral_trend),
        is_bestseller = COALESCE((p_updates->>'is_bestseller')::BOOLEAN, is_bestseller),
        is_hidden = COALESCE((p_updates->>'is_hidden')::BOOLEAN, is_hidden)
    WHERE id = p_product_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
