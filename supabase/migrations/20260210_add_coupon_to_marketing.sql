-- Add coupon_code to marketing_campaigns
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS coupon_discount TEXT;
