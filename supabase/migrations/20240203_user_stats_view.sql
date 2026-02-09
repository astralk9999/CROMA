-- Create a view for user analytics to allow sorting by spending and favorites
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.role,
  p.created_at,
  COALESCE((
    SELECT SUM(total_amount) 
    FROM orders 
    WHERE user_id = p.id AND status != 'cancelled'
  ), 0) as total_spent,
  COALESCE((
    SELECT COUNT(*) 
    FROM favorites 
    WHERE user_id = p.id
  ), 0) as favorites_count,
  COALESCE((
    SELECT COUNT(*) 
    FROM orders 
    WHERE user_id = p.id
  ), 0) as orders_count
FROM profiles p;

-- Grant access to the view (it inherits base table permissions, but good to be explicit for our admin client)
GRANT SELECT ON user_stats TO authenticated;
GRANT SELECT ON user_stats TO service_role;
