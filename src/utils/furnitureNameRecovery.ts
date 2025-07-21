/**
 * Utility for recovering original furniture names when they're lost
 */

import { simpleFurnitureService } from '../services/simpleFurnitureService';

/**
 * Attempt to recover the original name of a furniture item
 */
export async function recoverFurnitureName(
  originalStoreId: string,
  furnitureType: string
): Promise<string | null> {
  try {
    console.log(`🔍 Attempting to recover name for ${originalStoreId} (type: ${furnitureType})`);
    
    // For custom GLB furniture, try to get from simpleFurnitureService
    if (furnitureType.startsWith('custom_')) {
      const customFurniture = await simpleFurnitureService.getAllCustomFurniture();
      const matchingFurniture = customFurniture.find(f => f.id === originalStoreId);
      
      if (matchingFurniture) {
        console.log(`✅ Recovered name "${matchingFurniture.name}" for ${originalStoreId}`);
        return matchingFurniture.name;
      }
    }
    
    // Could add more recovery methods here for other furniture types
    
    console.log(`❌ Could not recover name for ${originalStoreId}`);
    return null;
  } catch (error) {
    console.error(`Error recovering furniture name for ${originalStoreId}:`, error);
    return null;
  }
}

/**
 * Generate a user-friendly name from furniture ID
 */
export function generateFriendlyName(furnitureId: string): string {
  // Remove common prefixes and suffixes
  let cleanName = furnitureId
    .replace(/^(furniture_|custom_)/i, '') // Remove common prefixes
    .replace(/(_\d+)+$/g, '') // Remove trailing numbers like _12345
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
  
  // Add "Custom Furniture" prefix for obviously generated IDs
  if (furnitureId.includes('_') && furnitureId.length > 20) {
    cleanName = `Custom Furniture`;
  }
  
  return cleanName;
}

/**
 * Validate if a name looks like an auto-generated ID vs a real name
 */
export function isGeneratedName(name: string): boolean {
  // Check for patterns that indicate auto-generated names
  const generatedPatterns = [
    /^furniture_/i,
    /^custom_/i,
    /^[a-f0-9]{8,}/i, // Long hex strings
    /_\d{4,}/, // Contains long numbers
    /^[A-Z][a-z]+_[A-Z][a-z]+_\d+$/, // Pattern like "Furniture_Id_123"
  ];
  
  return generatedPatterns.some(pattern => pattern.test(name));
}
