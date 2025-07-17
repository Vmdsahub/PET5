/*
  # Temporarily disable RLS for custom_furniture
  
  This migration temporarily disables RLS for debugging purposes.
  This should be re-enabled once the issue is resolved.
*/

-- Temporarily disable RLS
ALTER TABLE custom_furniture DISABLE ROW LEVEL SECURITY;

-- Grant broader permissions
GRANT ALL ON custom_furniture TO authenticated;
GRANT ALL ON custom_furniture TO anon;
