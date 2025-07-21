/**
 * Critical position fixer utility to handle emergency furniture corrections
 */

import * as THREE from "three";
import { isProblematicPosition, generateSafePosition, correctPositionImmediately } from "./ghostFurnitureDetector";

export interface CriticalFixResult {
  fixed: number;
  removed: number;
  errors: string[];
}

/**
 * Perform emergency position fixing for all furniture in the scene
 */
export function performEmergencyPositionFix(
  furnitureManager: any,
  saveCallback?: (furnitureId: string) => void
): CriticalFixResult {
  const result: CriticalFixResult = {
    fixed: 0,
    removed: 0,
    errors: []
  };

  try {
    console.log(`🆘 Starting emergency position fix...`);
    
    if (!furnitureManager || typeof furnitureManager.getAllFurniture !== 'function') {
      result.errors.push('Invalid furniture manager provided');
      return result;
    }

    const allFurniture = furnitureManager.getAllFurniture();
    console.log(`🔍 Checking ${allFurniture.length} furniture items for critical position errors...`);

    allFurniture.forEach((furniture: any, index: number) => {
      if (!furniture || !furniture.object || !furniture.object.position) {
        console.warn(`⚠️ Invalid furniture object at index ${index}`);
        return;
      }

      const position = furniture.object.position;
      
      if (isProblematicPosition(position)) {
        console.error(`❌️ CRITICAL: Furniture ${furniture.id} is in problematic position! EMERGENCY CORRECTION...`);
        
        try {
          // Generate guaranteed safe position
          const safePosition = generateSafePosition(index, 12); // Start further from center
          
          // Apply position immediately and forcefully
          furniture.object.position.set(safePosition.x, safePosition.y, safePosition.z);
          furniture.object.updateMatrix();
          furniture.object.updateMatrixWorld(true);
          
          // Verify the correction worked
          const verifyPosition = furniture.object.position;
          if (isProblematicPosition(verifyPosition)) {
            console.error(`❌️ ULTIMATE FAILURE: Cannot fix ${furniture.id}! REMOVING...`);
            
            // Remove as absolute last resort
            if (typeof furnitureManager.removeFurniture === 'function') {
              furnitureManager.removeFurniture(furniture.id);
              result.removed++;
            }
          } else {
            console.log(`✅ SUCCESS: ${furniture.id} corrected to (${verifyPosition.x.toFixed(2)}, ${verifyPosition.y.toFixed(2)}, ${verifyPosition.z.toFixed(2)})`);\n            result.fixed++;
            
            // Save the correction immediately if callback provided
            if (saveCallback) {
              setTimeout(() => {
                saveCallback(furniture.id);
              }, index * 100); // Stagger saves
            }
          }
        } catch (error) {
          const errorMsg = `Failed to fix furniture ${furniture.id}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }
    });

    console.log(`🆘 Emergency position fix completed: ${result.fixed} fixed, ${result.removed} removed`);
    return result;

  } catch (error) {
    console.error('Error during emergency position fix:', error);
    result.errors.push(`Emergency fix failed: ${error}`);
    return result;
  }
}

/**
 * Validate and correct a single position before applying it
 */
export function validateAndCorrectPosition(
  position: { x: number; y: number; z: number },
  furnitureId: string,
  index: number = 0
): { x: number; y: number; z: number } {
  if (isProblematicPosition(position)) {
    console.warn(`⚠️ Preventing problematic position for ${furnitureId}: (${position.x}, ${position.y}, ${position.z})`);
    return correctPositionImmediately(position, index);
  }
  
  return position;
}

/**
 * Monitor furniture positions and fix any that become problematic
 */
export function startPositionMonitoring(
  furnitureManager: any,
  saveCallback?: (furnitureId: string) => void,
  intervalMs: number = 5000
): () => void {
  console.log(`👁️ Starting position monitoring every ${intervalMs}ms...`);
  
  const monitoringInterval = setInterval(() => {
    if (!furnitureManager) return;
    
    const allFurniture = furnitureManager.getAllFurniture?.() || [];
    let foundProblematic = false;
    
    allFurniture.forEach((furniture: any, index: number) => {
      if (furniture?.object?.position) {
        const pos = furniture.object.position;
        if (isProblematicPosition(pos)) {
          foundProblematic = true;
          console.error(`👁️ MONITORING ALERT: Found problematic furniture ${furniture.id} at (${pos.x}, ${pos.y}, ${pos.z})`);
          
          // Emergency correction
          const safePosition = generateSafePosition(index, 10);
          furniture.object.position.set(safePosition.x, safePosition.y, safePosition.z);
          furniture.object.updateMatrix();
          furniture.object.updateMatrixWorld(true);
          
          console.log(`⚕️ MONITORING FIX: Moved ${furniture.id} to (${safePosition.x.toFixed(2)}, ${safePosition.y.toFixed(2)}, ${safePosition.z.toFixed(2)})`);\n          
          // Save the emergency fix
          if (saveCallback) {
            setTimeout(() => {
              saveCallback(furniture.id);
            }, 200);
          }
        }
      }
    });
    
    if (!foundProblematic) {
      console.log(`👁️ Position monitoring: All furniture positions are safe`);\n    }
  }, intervalMs);
  
  // Return cleanup function
  return () => {
    clearInterval(monitoringInterval);
    console.log(`👁️ Position monitoring stopped`);
  };
}