/*
  # Create RPC function for custom furniture
  
  This creates an RPC function that bypasses RLS to get custom furniture.
*/

-- Create RPC function to get custom furniture
CREATE OR REPLACE FUNCTION get_custom_furniture()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  glb_url text,
  thumbnail_url text,
  price integer,
  currency text,
  created_by uuid,
  is_active boolean,
  category text,
  tags text[],
  metadata jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT 
    cf.id,
    cf.name,
    cf.description,
    cf.glb_url,
    cf.thumbnail_url,
    cf.price,
    cf.currency,
    cf.created_by,
    cf.is_active,
    cf.category,
    cf.tags,
    cf.metadata,
    cf.created_at,
    cf.updated_at
  FROM custom_furniture cf
  WHERE cf.is_active = true
  ORDER BY cf.created_at DESC;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_custom_furniture() TO authenticated;
GRANT EXECUTE ON FUNCTION get_custom_furniture() TO anon;
