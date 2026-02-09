-- Create a table to link return requests to specific order items
CREATE TABLE IF NOT EXISTS return_request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_request_id UUID REFERENCES return_requests(id) ON DELETE CASCADE NOT NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(return_request_id, order_item_id) -- Prevent same item being added twice to same request
);

-- Enable RLS (though for now we might disable it if it causes issues, but good practice)
ALTER TABLE return_request_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own return items (via return_requests)
CREATE POLICY "Users can view their own return items" 
ON return_request_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM return_requests 
    WHERE return_requests.id = return_request_items.return_request_id 
    AND return_requests.user_id = auth.uid()
  )
);

-- Policy: Admins can view all
CREATE POLICY "Admins have full access to return items" 
ON return_request_items FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- No INSERT policy needed for users if we use supabaseAdmin or if we relax it later like return_requests
-- But for consistency with the hotfix:
CREATE POLICY "Service role or API inserts" 
ON return_request_items FOR INSERT 
TO authenticated
WITH CHECK (true);
