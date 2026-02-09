-- Migration: Create recently_viewed table for product view tracking
-- This enables "forgotten cart" reminder emails

CREATE TABLE IF NOT EXISTS recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Index for efficient queries by user
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed(user_id);

-- Index for cleanup queries (old entries)
CREATE INDEX IF NOT EXISTS idx_recently_viewed_viewed_at ON recently_viewed(viewed_at);

-- RLS Policies
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- Users can view their own recently viewed products
CREATE POLICY "Users can view own recently viewed"
    ON recently_viewed FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own views
CREATE POLICY "Users can track own views"
    ON recently_viewed FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own views
CREATE POLICY "Users can delete own views"
    ON recently_viewed FOR DELETE
    USING (auth.uid() = user_id);

-- Allow upsert (update viewed_at on conflict)
CREATE POLICY "Users can update own views"
    ON recently_viewed FOR UPDATE
    USING (auth.uid() = user_id);
