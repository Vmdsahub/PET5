/**
 * Utility to clean up corrupted localStorage data for furniture
 */

export interface CleanupStats {
  furnitureRemoved: number;
  templatesRemoved: number;
  totalCleaned: number;
  errors: string[];
}

/**
 * Clean all furniture-related data from localStorage for a user
 */
export function cleanUserFurnitureData(userId: string): CleanupStats {
  const stats: CleanupStats = {
    furnitureRemoved: 0,
    templatesRemoved: 0,
    totalCleaned: 0,
    errors: []
  };

  try {
    console.log(`🧹 Starting complete cleanup of localStorage for user: ${userId}`);
    
    const keysToRemove: string[] = [];
    
    // Find all keys related to furniture for this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Furniture state keys
        if (key.startsWith(`furniture_${userId}_`)) {
          keysToRemove.push(key);
          stats.furnitureRemoved++;
        }
        // Template keys
        else if (key.startsWith(`furniture_templates_${userId}`)) {
          keysToRemove.push(key);
          stats.templatesRemoved++;
        }
      }
    }

    console.log(`🔍 Found ${keysToRemove.length} furniture-related keys to remove`);
    
    // Remove all found keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        stats.totalCleaned++;
        console.log(`🗑️ Removed: ${key}`);
      } catch (error) {
        stats.errors.push(`Failed to remove ${key}: ${error}`);
      }
    });

    console.log(`✅ Cleanup completed: ${stats.totalCleaned} items removed`);
    console.log(`📊 Stats: ${stats.furnitureRemoved} furniture, ${stats.templatesRemoved} templates`);
    
    return stats;

  } catch (error) {
    console.error('❌ Error during localStorage cleanup:', error);
    stats.errors.push(`Cleanup failed: ${error}`);
    return stats;
  }
}

/**
 * Get summary of current localStorage usage for debugging
 */
export function getStorageDebugInfo(userId: string): any {
  const info = {
    totalKeys: localStorage.length,
    furnitureKeys: 0,
    templateKeys: 0,
    otherKeys: 0,
    furnitureItems: [] as string[],
    templateItems: [] as string[]
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (key.startsWith(`furniture_${userId}_`)) {
        info.furnitureKeys++;
        info.furnitureItems.push(key);
      } else if (key.startsWith(`furniture_templates_${userId}`)) {
        info.templateKeys++;
        info.templateItems.push(key);
      } else {
        info.otherKeys++;
      }
    }
  }

  return info;
}

/**
 * Clean up specific corrupted entries (ones that fail to parse)
 */
export function cleanCorruptedEntries(userId: string): CleanupStats {
  const stats: CleanupStats = {
    furnitureRemoved: 0,
    templatesRemoved: 0,
    totalCleaned: 0,
    errors: []
  };

  try {
    console.log(`🔍 Checking for corrupted entries for user: ${userId}`);
    
    const keysToCheck: string[] = [];
    
    // Find all furniture keys for this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`furniture_${userId}_`)) {
        keysToCheck.push(key);
      }
    }

    console.log(`📋 Checking ${keysToCheck.length} keys for corruption`);
    
    keysToCheck.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          
          // Check for required fields
          if (!parsed.furniture_id || !parsed.furniture_type || !parsed.position) {
            console.warn(`🗑️ Removing corrupted entry: ${key} - missing required fields`);
            localStorage.removeItem(key);
            stats.furnitureRemoved++;
            stats.totalCleaned++;
          }
          // Check for invalid positions
          else if (
            typeof parsed.position.x !== 'number' || 
            typeof parsed.position.y !== 'number' || 
            typeof parsed.position.z !== 'number' ||
            isNaN(parsed.position.x) || 
            isNaN(parsed.position.y) || 
            isNaN(parsed.position.z)
          ) {
            console.warn(`🗑️ Removing entry with invalid position: ${key}`);
            localStorage.removeItem(key);
            stats.furnitureRemoved++;
            stats.totalCleaned++;
          }
        }
      } catch (error) {
        console.warn(`🗑️ Removing unparseable entry: ${key}`);
        localStorage.removeItem(key);
        stats.furnitureRemoved++;
        stats.totalCleaned++;
        stats.errors.push(`Failed to parse ${key}: ${error}`);
      }
    });

    console.log(`✅ Corruption check completed: ${stats.totalCleaned} corrupted items removed`);
    return stats;

  } catch (error) {
    console.error('❌ Error during corruption check:', error);
    stats.errors.push(`Corruption check failed: ${error}`);
    return stats;
  }
}
