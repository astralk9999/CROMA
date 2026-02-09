-- MARKETING CAMPAIGNS HISTORY
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target TEXT NOT NULL,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    total_recipients INTEGER DEFAULT 0,
    cta_text TEXT,
    cta_link TEXT,
    product_ids UUID[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin Policy
CREATE POLICY "Admins can do everything on marketing_campaigns"
ON marketing_campaigns
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
