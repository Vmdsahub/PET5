/*
  # Fix Custom Furniture RLS Policies
  
  This migration fixes the RLS policies for custom_furniture table
  to ensure admins can properly access their uploaded furniture.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Everyone can view active custom furniture" ON custom_furniture;
DROP POLICY IF EXISTS "Admins can manage custom furniture" ON custom_furniture;

-- Create new, more permissive policies
CREATE POLICY "Anyone can view active custom furniture"
  ON custom_furniture FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage custom furniture"
  ON custom_furniture FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Ensure the table has proper permissions
GRANT ALL ON custom_furniture TO authenticated;
GRANT ALL ON custom_furniture TO service_role;
