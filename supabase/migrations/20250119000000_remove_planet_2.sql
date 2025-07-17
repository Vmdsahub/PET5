/*
  # Remove Planet 2 (Mundo Alienígena)
  
  This migration removes the Planet 2 record from the world_positions table
  to keep the database in sync with the codebase.
*/

-- Remove Planet 2 from world_positions table
DELETE FROM world_positions WHERE id = 'planet-2';
