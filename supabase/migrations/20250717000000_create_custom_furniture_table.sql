/*
  # Create Custom Furniture Table
  
  This migration creates:
  1. A table to store custom furniture uploaded by admins
  2. Storage bucket for GLB files
  3. Policies for admin management and user purchase access
*/

-- Create custom_furniture table
CREATE TABLE IF NOT EXISTS custom_furniture (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  glb_url text NOT NULL,
  thumbnail_url text,
  price integer DEFAULT 10, -- Default 10 Xenocoins
  currency text DEFAULT 'xenocoins' CHECK (currency IN ('xenocoins', 'cash')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  category text DEFAULT 'admin' CHECK (category IN ('admin', 'premium', 'seasonal')),
  tags text[], -- Array of tags for categorization
  metadata jsonb DEFAULT '{}', -- For storing additional furniture properties
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE custom_furniture ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active custom furniture"
  ON custom_furniture FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage custom furniture"
  ON custom_furniture FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create storage bucket for GLB files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('furniture-glb', 'furniture-glb', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Admins can upload GLB files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'furniture-glb' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Everyone can view GLB files"
ON storage.objects FOR SELECT
USING (bucket_id = 'furniture-glb');

CREATE POLICY "Admins can update GLB files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'furniture-glb' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can delete GLB files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'furniture-glb' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Add custom furniture to shop_items automatically
CREATE OR REPLACE FUNCTION add_custom_furniture_to_shop()
RETURNS TRIGGER AS $$
BEGIN
  -- Add to admin catalog shop (create if doesn't exist)
  INSERT INTO shops (id, name, description, is_active)
  VALUES ('admin-catalog', 'Catálogo de Admin', 'Móveis customizados criados pelos administradores', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Add furniture as shop item
  INSERT INTO shop_items (
    shop_id,
    item_id,
    price,
    currency,
    stock_limit,
    is_available
  ) VALUES (
    'admin-catalog',
    NEW.id::text, -- Using furniture ID as item reference
    NEW.price,
    NEW.currency,
    NULL, -- Unlimited stock
    NEW.is_active
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add custom furniture to shop
CREATE TRIGGER add_custom_furniture_to_shop_trigger
  AFTER INSERT ON custom_furniture
  FOR EACH ROW
  EXECUTE FUNCTION add_custom_furniture_to_shop();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_custom_furniture_updated_at
  BEFORE UPDATE ON custom_furniture
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some example categories/tags
COMMENT ON COLUMN custom_furniture.tags IS 'Tags for categorization: ["table", "chair", "lamp", "decoration", "modern", "classic", etc.]';
COMMENT ON COLUMN custom_furniture.metadata IS 'JSON metadata: {"scale": {"min": 0.5, "max": 2.0}, "lighting": true, "interactive": false}';
