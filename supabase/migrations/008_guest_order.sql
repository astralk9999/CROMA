-- Migration to allow guest orders by making user_id nullable
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Optionally add a guest_email column if we want to index/query it easily, 
-- though it will also be in shipping_address JSONB
-- ALTER TABLE public.orders ADD COLUMN guest_email TEXT;
