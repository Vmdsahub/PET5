/*
  # Add furniture_name column to user_room_decorations table
  
  This migration adds a new column to store the original name of furniture items,
  fixing the issue where furniture names were not being persisted correctly.
*/

-- Add furniture_name column to user_room_decorations table
ALTER TABLE user_room_decorations 
ADD COLUMN IF NOT EXISTS furniture_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_room_decorations.furniture_name IS 'Original name of the furniture item as displayed to the user';

-- Create index for performance when querying by name
CREATE INDEX IF NOT EXISTS idx_user_room_decorations_furniture_name 
ON user_room_decorations(furniture_name) 
WHERE furniture_name IS NOT NULL;
