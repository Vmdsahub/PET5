/**
 * Utility for cleaning up corrupted furniture data
 */

import { roomDecorationService } from '../services/roomDecorationService';

export interface CleanupResult {
  cleaned: number;
  errors: string[];
}

/**
 * Clean up corrupted furniture data for a user
 */
export async function cleanupCorruptedFurnitureData(userId: string): Promise<CleanupResult> {
  const result: CleanupResult = {
    cleaned: 0,
    errors: []
  };

  try {
    console.log(`🧹 Starting cleanup of corrupted furniture data for user ${userId}`);
    
    // Load all decorations
    const loadResult = await roomDecorationService.loadUserRoomDecorations(userId);
    
    if (!loadResult.success || !loadResult.decorations) {
      result.errors.push('Failed to load decorations for cleanup');
      return result;
    }

    console.log(`📋 Found ${loadResult.decorations.length} decorations to analyze`);

    for (const decoration of loadResult.decorations) {
      let shouldClean = false;
      const issues: string[] = [];

      // Check for invalid positions
      if (
        isNaN(decoration.position.x) || 
        isNaN(decoration.position.y) || 
        isNaN(decoration.position.z) ||
        Math.abs(decoration.position.x) > 100 ||
        Math.abs(decoration.position.z) > 100 ||
        decoration.position.y < -10 || 
        decoration.position.y > 50
      ) {
        issues.push('invalid position');
        shouldClean = true;
      }

      // Check for invalid scale
      if (
        isNaN(decoration.scale.x) || 
        isNaN(decoration.scale.y) || 
        isNaN(decoration.scale.z) ||
        decoration.scale.x <= 0 || 
        decoration.scale.y <= 0 || 
        decoration.scale.z <= 0 ||
        decoration.scale.x > 20 || 
        decoration.scale.y > 20 || 
        decoration.scale.z > 20
      ) {
        issues.push('invalid scale');
        shouldClean = true;
      }

      // Check for invalid rotation (NaN values)
      if (
        isNaN(decoration.rotation.x) || 
        isNaN(decoration.rotation.y) || 
        isNaN(decoration.rotation.z)
      ) {
        issues.push('invalid rotation');
        shouldClean = true;
      }

      // Check for missing essential data
      if (!decoration.furniture_id || !decoration.furniture_type) {
        issues.push('missing essential data');
        shouldClean = true;
      }

      if (shouldClean) {
        console.warn(`🗑️ Cleaning corrupted furniture ${decoration.furniture_id}: ${issues.join(', ')}`);
        
        try {
          await roomDecorationService.removeFurnitureFromRoom(userId, decoration.furniture_id);
          result.cleaned++;
          console.log(`✅ Cleaned furniture ${decoration.furniture_id}`);
        } catch (error) {
          const errorMsg = `Failed to clean furniture ${decoration.furniture_id}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }
    }

    console.log(`🧹 Cleanup completed: ${result.cleaned} items cleaned, ${result.errors.length} errors`);
    return result;

  } catch (error) {
    console.error('Error during furniture data cleanup:', error);
    result.errors.push(`Cleanup process failed: ${error}`);
    return result;
  }
}

/**
 * Validate a single decoration object
 */
export function validateDecoration(decoration: any): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!decoration) {
    issues.push('decoration is null or undefined');
    return { valid: false, issues };
  }

  if (!decoration.furniture_id) {
    issues.push('missing furniture_id');
  }

  if (!decoration.furniture_type) {
    issues.push('missing furniture_type');
  }

  if (!decoration.position || typeof decoration.position !== 'object') {
    issues.push('missing or invalid position object');
  } else {
    if (typeof decoration.position.x !== 'number' || isNaN(decoration.position.x)) {
      issues.push('invalid position.x');
    }
    if (typeof decoration.position.y !== 'number' || isNaN(decoration.position.y)) {
      issues.push('invalid position.y');
    }
    if (typeof decoration.position.z !== 'number' || isNaN(decoration.position.z)) {
      issues.push('invalid position.z');
    }
  }

  return { valid: issues.length === 0, issues };
}
