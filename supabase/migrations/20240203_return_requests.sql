-- Create a table for return requests
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We are assuming RLS might be bypassed or handled via supabaseAdmin in APIs, 
-- but we add policies for completeness.
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own return requests
DROP POLICY IF EXISTS "Users can view their own returns" ON return_requests;
CREATE POLICY "Users can view their own returns" 
ON return_requests FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create return requests (validated at API level)
DROP POLICY IF EXISTS "Users can create return requests" ON return_requests;
CREATE POLICY "Users can create return requests" 
ON return_requests FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Policy: Admins can do everything
DROP POLICY IF EXISTS "Admins have full access to returns" ON return_requests;
CREATE POLICY "Admins have full access to returns" 
ON return_requests FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
));
