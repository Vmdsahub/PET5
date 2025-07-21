/**
 * Quarantine system for problematic furniture
 * Moves furniture to guaranteed safe positions when correction fails
 */

export interface QuarantinePosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Generate guaranteed safe quarantine positions
 * These positions are far from center and problems
 */
export function generateQuarantinePosition(index: number): QuarantinePosition {
  // Create positions in a safe zone far from center
  const baseX = 50; // Start at x=50 (far from center)
  const baseZ = 50; // Start at z=50 (far from center)
  
  // Arrange in a grid pattern in the quarantine zone
  const gridSize = 5;
  const spacing = 3;
  
  const gridX = (index % gridSize) * spacing;
  const gridZ = Math.floor(index / gridSize) * spacing;
  
  return {
    x: baseX + gridX,
    y: 1.0, // Elevated to ensure visibility
    z: baseZ + gridZ
  };
}

/**
 * Move furniture to quarantine zone
 */
export function quarantineFurniture(
  furnitureObject: any, 
  furnitureId: string, 
  index: number
): QuarantinePosition {
  const quarantinePos = generateQuarantinePosition(index);
  
  console.log(`🏥 QUARANTINE: Moving ${furnitureId} to quarantine zone at (${quarantinePos.x}, ${quarantinePos.y}, ${quarantinePos.z})`);
  
  // Apply position using multiple methods to ensure it sticks
  furnitureObject.position.x = quarantinePos.x;
  furnitureObject.position.y = quarantinePos.y;
  furnitureObject.position.z = quarantinePos.z;
  furnitureObject.position.set(quarantinePos.x, quarantinePos.y, quarantinePos.z);
  
  // Force matrix updates
  furnitureObject.updateMatrix();
  furnitureObject.updateMatrixWorld(true);
  
  // Add quarantine metadata
  if (furnitureObject.userData) {
    furnitureObject.userData.quarantined = true;
    furnitureObject.userData.quarantineReason = 'problematic_position';
    furnitureObject.userData.quarantineTime = Date.now();
  }
  
  console.log(`🏥 Quarantine complete for ${furnitureId}. New position: (${furnitureObject.position.x}, ${furnitureObject.position.y}, ${furnitureObject.position.z})`);
  
  return quarantinePos;
}

/**
 * Check if a position is in the quarantine zone
 */
export function isInQuarantineZone(position: QuarantinePosition): boolean {
  return position.x >= 40 && position.z >= 40;
}

/**
 * Get quarantine statistics
 */
export function getQuarantineStats(allFurniture: any[]): {
  total: number;
  quarantined: number;
  quarantinedItems: any[];
} {
  const quarantinedItems = allFurniture.filter(furniture => 
    furniture?.object?.userData?.quarantined === true
  );
  
  return {
    total: allFurniture.length,
    quarantined: quarantinedItems.length,
    quarantinedItems
  };
}

/**
 * Release furniture from quarantine (move back to safe normal position)
 */
export function releaseFromQuarantine(
  furnitureObject: any,
  furnitureId: string,
  targetIndex: number
): QuarantinePosition {
  // Generate safe position in normal area
  const angle = (targetIndex * 45) * (Math.PI / 180);
  const radius = 8 + (targetIndex * 1.5);
  
  const safePos = {
    x: Math.cos(angle) * radius,
    y: 0.1,
    z: Math.sin(angle) * radius
  };
  
  console.log(`🏥➡️ RELEASE: Moving ${furnitureId} from quarantine to safe position (${safePos.x}, ${safePos.y}, ${safePos.z})`);
  
  furnitureObject.position.set(safePos.x, safePos.y, safePos.z);
  furnitureObject.updateMatrix();
  furnitureObject.updateMatrixWorld(true);
  
  // Remove quarantine metadata
  if (furnitureObject.userData) {
    delete furnitureObject.userData.quarantined;
    delete furnitureObject.userData.quarantineReason;
    delete furnitureObject.userData.quarantineTime;
  }
  
  return safePos;
}
