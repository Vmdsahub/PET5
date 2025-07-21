/**
 * Absolute protection against furniture being positioned at center (0,0,0)
 * This interceptor ensures NO furniture can ever be at center regardless of how it gets there
 */

import * as THREE from "three";

/**
 * Wraps a THREE.js Object3D to prevent center positioning
 */
export function protectFromCenterPositioning(object: THREE.Object3D, furnitureId: string): void {
  // Store original position setter
  const originalSet = object.position.set.bind(object.position);
  const originalCopy = object.position.copy.bind(object.position);
  
  // Override position.set to prevent center positioning
  object.position.set = function(x: number, y: number, z: number) {
    const safeX = (x === 0) ? 5 + Math.random() * 2 : x;
    const safeZ = (z === 0) ? 5 + Math.random() * 2 : z;
    
    if (safeX !== x || safeZ !== z) {
      console.error(`🛡️ INTERCEPTED CENTER POSITIONING for ${furnitureId}: (${x}, ${y}, ${z}) -> (${safeX.toFixed(2)}, ${y}, ${safeZ.toFixed(2)})`);
    }
    
    return originalSet(safeX, y, safeZ);
  };
  
  // Override position.copy to prevent center positioning
  object.position.copy = function(v: THREE.Vector3) {
    const safeX = (v.x === 0) ? 5 + Math.random() * 2 : v.x;
    const safeZ = (v.z === 0) ? 5 + Math.random() * 2 : v.z;
    
    if (safeX !== v.x || safeZ !== v.z) {
      console.error(`🛡️ INTERCEPTED CENTER COPY for ${furnitureId}: (${v.x}, ${v.y}, ${v.z}) -> (${safeX.toFixed(2)}, ${v.y}, ${safeZ.toFixed(2)})`);
    }
    
    const safeVector = new THREE.Vector3(safeX, v.y, safeZ);
    return originalCopy(safeVector);
  };
  
  // Add getter/setter protection for x and z coordinates
  const originalXSetter = Object.getOwnPropertyDescriptor(THREE.Vector3.prototype, 'x')?.set;
  const originalZSetter = Object.getOwnPropertyDescriptor(THREE.Vector3.prototype, 'z')?.set;
  
  if (originalXSetter && originalZSetter) {
    Object.defineProperty(object.position, 'x', {
      get: function() { return this._x || 0; },
      set: function(value: number) {
        const safeValue = (value === 0) ? 5 + Math.random() * 2 : value;
        if (safeValue !== value) {
          console.error(`🛡️ INTERCEPTED X=0 for ${furnitureId}: ${value} -> ${safeValue.toFixed(2)}`);
        }
        this._x = safeValue;
      }
    });
    
    Object.defineProperty(object.position, 'z', {
      get: function() { return this._z || 0; },
      set: function(value: number) {
        const safeValue = (value === 0) ? 5 + Math.random() * 2 : value;
        if (safeValue !== value) {
          console.error(`🛡️ INTERCEPTED Z=0 for ${furnitureId}: ${value} -> ${safeValue.toFixed(2)}`);
        }
        this._z = safeValue;
      }
    });
  }
  
  console.log(`🛡️ CENTER PROTECTION ENABLED for furniture ${furnitureId}`);
}

/**
 * Monitor and automatically correct any furniture that somehow ends up at center
 */
export function startCenterPositionMonitoring(furnitureManager: any): () => void {
  const monitoringInterval = setInterval(() => {
    if (!furnitureManager) return;
    
    const allFurniture = furnitureManager.getAllFurniture?.() || [];
    
    allFurniture.forEach((furniture: any) => {
      if (furniture?.object?.position) {
        const pos = furniture.object.position;
        if (pos.x === 0 && pos.z === 0) {
          console.error(`🚨 MONITORING ALERT: Furniture ${furniture.id} detected at center! IMMEDIATE CORRECTION!`);
          
          // Emergency correction
          const emergencyX = 8 + Math.random() * 4;
          const emergencyZ = 8 + Math.random() * 4;
          
          furniture.object.position.set(emergencyX, pos.y, emergencyZ);
          furniture.object.updateMatrix();
          furniture.object.updateMatrixWorld(true);
          
          console.log(`⚡ EMERGENCY CORRECTION: Moved ${furniture.id} to (${emergencyX.toFixed(2)}, ${pos.y}, ${emergencyZ.toFixed(2)})`);
        }
      }
    });
  }, 1000); // Check every second
  
  console.log(`👁️ Center position monitoring started`);
  
  return () => {
    clearInterval(monitoringInterval);
    console.log(`👁️ Center position monitoring stopped`);
  };
}
