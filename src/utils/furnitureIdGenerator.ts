/**
 * Utility for generating unique and consistent IDs for furniture items
 */

/**
 * Generate a unique database ID for furniture placement
 * Uses crypto.randomUUID() for true uniqueness
 */
export function generateFurnitureDatabaseId(originalStoreId: string): string {
  // Use crypto.randomUUID() for guaranteed uniqueness
  const uniqueId = crypto.randomUUID();
  
  // Format: originalId_uuid (easier to debug)
  return `${originalStoreId}_${uniqueId}`;
}

/**
 * Extract original store ID from database ID
 */
export function extractOriginalStoreId(databaseId: string): string {
  // Split by underscore and take the first part
  const parts = databaseId.split('_');
  return parts[0];
}

/**
 * Generate furniture type for factory (custom GLB furniture)
 */
export function generateFurnitureType(originalStoreId: string): string {
  return `custom_${originalStoreId}`;
}

/**
 * Extract furniture ID from furniture type
 */
export function extractFurnitureIdFromType(furnitureType: string): string {
  if (furnitureType.startsWith('custom_')) {
    return furnitureType.replace('custom_', '');
  }
  return furnitureType;
}

/**
 * Validate if a string is a valid database ID format
 */
export function isValidDatabaseId(id: string): boolean {
  // Check if it follows the pattern: originalId_uuid
  const parts = id.split('_');
  if (parts.length < 2) return false;
  
  // Check if the last part looks like a UUID
  const uuidPart = parts.slice(1).join('_');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuidPart);
}

/**
 * Validate if a string is a valid furniture type for custom GLB
 */
export function isCustomFurnitureType(furnitureType: string): boolean {
  return furnitureType.startsWith('custom_') && furnitureType.length > 7;
}

/**
 * Debug info for ID mapping
 */
export function debugIdMapping(id: string, context: string = '') {
  console.log(`🔍 [${context}] ID Mapping Debug:`, {
    inputId: id,
    isValidDatabaseId: isValidDatabaseId(id),
    isCustomType: isCustomFurnitureType(id),
    extractedStoreId: isValidDatabaseId(id) ? extractOriginalStoreId(id) : 'N/A',
    extractedFromType: isCustomFurnitureType(id) ? extractFurnitureIdFromType(id) : 'N/A'
  });
}
