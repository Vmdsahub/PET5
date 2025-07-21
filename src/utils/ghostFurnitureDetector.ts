/**
 * Utility to detect and remove ghost furniture from the 3D scene
 */

export interface GhostDetectionResult {
  found: number;
  removed: number;
  errors: string[];
}

/**
 * Check if a position is problematic (center or invalid)
 */
export function isProblematicPosition(position: { x: number; y: number; z: number }): boolean {
  return (
    // Very close to center (problematic)
    (Math.abs(position.x) < 0.3 && Math.abs(position.z) < 0.3) ||
    // Invalid positions
    isNaN(position.x) || isNaN(position.y) || isNaN(position.z) ||
    // Too extreme positions
    Math.abs(position.x) > 100 || Math.abs(position.z) > 100 ||
    // Underground or too high
    position.y < -5 || position.y > 50
  );
}

/**
 * Detect ghost furniture in the scene that shouldn't be there
 */
export function detectGhostFurniture(furnitureManager: any): GhostDetectionResult {
  const result: GhostDetectionResult = {
    found: 0,
    removed: 0,
    errors: []
  };

  try {
    console.log(`👻 Starting ghost furniture detection...`);
    
    if (!furnitureManager || typeof furnitureManager.getAllFurniture !== 'function') {
      result.errors.push('Invalid furniture manager provided');
      return result;
    }

    const allFurniture = furnitureManager.getAllFurniture();
    console.log(`🔍 Checking ${allFurniture.length} furniture items for ghosts...`);

    const problematicFurniture: any[] = [];

    allFurniture.forEach((furniture: any) => {
      if (!furniture || !furniture.object) {
        problematicFurniture.push({ furniture, reason: 'no object' });
        return;
      }

      const position = furniture.object.position;
      if (isProblematicPosition(position)) {
        problematicFurniture.push({ 
          furniture, 
          reason: `problematic position (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})` 
        });
      }

      // Check for furniture without proper ID or userData
      if (!furniture.id || !furniture.object.userData) {
        problematicFurniture.push({ furniture, reason: 'missing ID or userData' });
      }

      // Check for furniture with invalid names
      if (furniture.object.userData && !furniture.object.userData.originalName) {
        const generatedName = furniture.id?.replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        if (generatedName && generatedName.includes('Furniture') && generatedName.length > 20) {
          problematicFurniture.push({ furniture, reason: 'likely auto-generated name/ID' });
        }
      }
    });

    result.found = problematicFurniture.length;
    console.log(`👻 Found ${result.found} problematic furniture items`);

    // Remove problematic furniture
    problematicFurniture.forEach(({ furniture, reason }) => {
      try {
        console.warn(`🗑️ Removing ghost furniture ${furniture.id}: ${reason}`);
        
        if (typeof furnitureManager.removeFurniture === 'function') {
          const removed = furnitureManager.removeFurniture(furniture.id);
          if (removed) {
            result.removed++;
            console.log(`✅ Successfully removed ghost furniture ${furniture.id}`);
          } else {
            console.warn(`⚠️ Failed to remove ghost furniture ${furniture.id}`);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to remove furniture ${furniture.id}: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    });

    console.log(`👻 Ghost detection completed: ${result.found} found, ${result.removed} removed`);
    return result;

  } catch (error) {
    console.error('Error during ghost furniture detection:', error);
    result.errors.push(`Detection failed: ${error}`);
    return result;
  }
}

/**
 * Force clean furniture group in the 3D scene
 */
export function forceCleanFurnitureGroup(scene: any, furnitureGroupName = 'furnitureGroup'): number {
  let removedCount = 0;
  
  try {
    console.log(`🧹 Force cleaning furniture group from scene...`);
    
    if (!scene || !scene.children) {
      console.warn('Invalid scene provided for cleaning');
      return 0;
    }

    // Find and remove furniture group
    const furnitureGroup = scene.children.find((child: any) => 
      child.name === furnitureGroupName || 
      child.userData?.type === 'furniture' ||
      child.type === 'Group'
    );

    if (furnitureGroup && furnitureGroup.children) {
      console.log(`🗑️ Found furniture group with ${furnitureGroup.children.length} children`);
      
      // Remove children that are in problematic positions
      const childrenToRemove: any[] = [];
      
      furnitureGroup.children.forEach((child: any) => {
        if (child.position && isProblematicPosition(child.position)) {
          childrenToRemove.push(child);
        }
      });

      childrenToRemove.forEach((child) => {
        try {
          furnitureGroup.remove(child);
          removedCount++;
          console.log(`🗑️ Removed problematic child at position (${child.position.x}, ${child.position.y}, ${child.position.z})`);
        } catch (error) {
          console.error('Error removing child:', error);
        }
      });
    }

    console.log(`🧹 Force cleaning completed: ${removedCount} objects removed`);
    return removedCount;

  } catch (error) {
    console.error('Error during force cleaning:', error);
    return removedCount;
  }
}
