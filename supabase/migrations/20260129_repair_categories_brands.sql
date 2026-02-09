-- Repair migration for categories and brands schema
-- Adds missing columns that might have been skipped if tables existed before column additions

DO $$ 
BEGIN
    -- Fix Categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'description') THEN
        ALTER TABLE public.categories ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'image') THEN
        ALTER TABLE public.categories ADD COLUMN image TEXT;
    END IF;

    -- Fix Brands
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'brands' AND column_name = 'logo') THEN
        ALTER TABLE public.brands ADD COLUMN logo TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'brands' AND column_name = 'website') THEN
        ALTER TABLE public.brands ADD COLUMN website TEXT;
    END IF;
END $$;
