/*
  # Create User Room Decorations Table
  
  This table stores the customized furniture state for each user's room,
  including position, scale, rotation, and material properties.
*/

-- Create user_room_decorations table
CREATE TABLE IF NOT EXISTS user_room_decorations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    furniture_id TEXT NOT NULL,
    furniture_type TEXT NOT NULL,
    
    -- Position data
    position_x REAL NOT NULL DEFAULT 0,
    position_y REAL NOT NULL DEFAULT 0,
    position_z REAL NOT NULL DEFAULT 0,
    
    -- Rotation data (in degrees)
    rotation_x REAL NOT NULL DEFAULT 0,
    rotation_y REAL NOT NULL DEFAULT 0,
    rotation_z REAL NOT NULL DEFAULT 0,
    
    -- Scale data
    scale_x REAL NOT NULL DEFAULT 1,
    scale_y REAL NOT NULL DEFAULT 1,
    scale_z REAL NOT NULL DEFAULT 1,
    
    -- Material properties
    material_roughness REAL DEFAULT 0.5,
    material_metalness REAL DEFAULT 0,
    material_color TEXT DEFAULT '#ffffff',
    material_emissive TEXT DEFAULT '#000000',
    
    -- Metadata
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one decoration entry per furniture per user
    UNIQUE(user_id, furniture_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_room_decorations_user_id ON user_room_decorations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_room_decorations_furniture_id ON user_room_decorations(furniture_id);
CREATE INDEX IF NOT EXISTS idx_user_room_decorations_active ON user_room_decorations(user_id, is_active);

-- Enable RLS
ALTER TABLE user_room_decorations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own room decorations"
  ON user_room_decorations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_room_decorations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_user_room_decorations_updated_at
    BEFORE UPDATE ON user_room_decorations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_room_decorations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_room_decorations IS 'Stores user-specific furniture positioning and customization data for room decoration';
COMMENT ON COLUMN user_room_decorations.furniture_id IS 'Unique identifier for the furniture piece (e.g., "sofa-1", "custom_123")';
COMMENT ON COLUMN user_room_decorations.furniture_type IS 'Type of furniture (e.g., "sofa", "custom_123", "lamp")';
COMMENT ON COLUMN user_room_decorations.is_active IS 'Whether the furniture is currently placed in the room';
