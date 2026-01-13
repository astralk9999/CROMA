-- Create newsletter_subscribers table for email subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for newsletter signups)
CREATE POLICY "Allow anonymous inserts" ON newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view subscribers" ON newsletter_subscribers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
