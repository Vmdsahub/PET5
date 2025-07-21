import * as THREE from "three";
import { FurnitureFactory } from "./FurnitureFactory";

interface FurnitureItem {
  id: string;
  object: THREE.Object3D;
  type: string;
  originalScale: THREE.Vector3;
  originalMaterials: Map<
    THREE.Mesh,
    {
      roughness: number;
      metalness: number;
      color: string;
      emissive: string;
    }
  >;
  canMove: boolean;
  canRotate: boolean;
  canScale: boolean;
}

export class FurnitureManager {
  private scene: THREE.Scene;
  private furnitureGroup: THREE.Group;
  private furniture: Map<string, FurnitureItem>;
  private furnitureFactory: FurnitureFactory;
  private furnitureLights: Map<string, THREE.PointLight>;
  private getRoomDimensions: () => any;

  // Global furniture templates for admin modifications
  private furnitureTemplates: Map<
    string,
    {
      scale?: { x: number; y: number; z: number };
      material?: {
        roughness: number;
        metalness: number;
        color: string;
        emissive: string;
      };
    }
  > = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.furnitureGroup = new THREE.Group();
    this.scene.add(this.furnitureGroup);
    this.furniture = new Map();
    this.furnitureFactory = new FurnitureFactory();
    this.furnitureLights = new Map();

    // Initialize furniture asynchronously
    this.initializeFurniture();
  }

  private async initializeFurniture(): Promise<void> {
    try {
      await this.createDefaultFurniture();
      console.log("Default furniture created successfully");
    } catch (error) {
      console.error("Error creating default furniture:", error);
    }
  }

  private async createDefaultFurniture(): Promise<void> {
    // Room starts completely empty - no default furniture
    console.log(
      "🏠 Room initialized without default furniture - ready for custom setup",
    );
  }

  private async addFurniture(
    id: string,
    type: string,
    position: THREE.Vector3,
    rotationY: number = 0,
  ): Promise<void> {
    console.log(
      `🪑 Adding furniture: ID=${id}, Type=${type}, Position=${position.x}, ${position.y}, ${position.z}`,
    );
    const furnitureObject = await this.furnitureFactory.create(type);

    if (!furnitureObject) {
      console.warn(`Failed to create furniture of type: ${type}`);
      return;
    }

    furnitureObject.position.copy(position);
    furnitureObject.rotation.y = rotationY;
    furnitureObject.userData = { id, type };

    // Auto-correct Y position for GLB models to ensure they sit on the floor
    if (type.startsWith("custom_")) {
      const bbox = new THREE.Box3().setFromObject(furnitureObject);
      const minY = bbox.min.y;

      // If the bottom of the object is below the floor (Y=0), adjust it
      if (minY < 0) {
        furnitureObject.position.y = furnitureObject.position.y - minY;
        console.log(
          `🔧 Adjusted GLB Y position from ${position.y} to ${furnitureObject.position.y} (minY was ${minY})`,
        );
      }
    }

    console.log(
      `✅ Furniture positioned at: ${furnitureObject.position.x}, ${furnitureObject.position.y}, ${furnitureObject.position.z}`,
    );

    // Store original material properties
    const originalMaterials = new Map<
      THREE.Mesh,
      {
        roughness: number;
        metalness: number;
        color: string;
        emissive: string;
      }
    >();

    furnitureObject.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          // For material arrays, store the first material as representative
          const mat = child.material[0] as THREE.MeshStandardMaterial;
          if (mat) {
            originalMaterials.set(child, {
              roughness: mat.roughness || 0.5,
              metalness: mat.metalness || 0,
              color: "#" + mat.color.getHexString(),
              emissive: "#" + mat.emissive.getHexString(),
            });
          }
        } else {
          const mat = child.material as THREE.MeshStandardMaterial;
          originalMaterials.set(child, {
            roughness: mat.roughness || 0.5,
            metalness: mat.metalness || 0,
            color: "#" + mat.color.getHexString(),
            emissive: "#" + mat.emissive.getHexString(),
          });
        }
      }
    });

    console.log(
      `📦 Stored original materials for ${id}:`,
      Array.from(originalMaterials.values()),
    );

    const furnitureItem: FurnitureItem = {
      id,
      object: furnitureObject,
      type,
      originalScale: furnitureObject.scale.clone(),
      originalMaterials,
      canMove: true,
      canRotate: true,
      canScale: true,
    };

    this.furniture.set(id, furnitureItem);
    this.furnitureGroup.add(furnitureObject);

    // Apply any existing template modifications for this furniture type
    const template = this.furnitureTemplates.get(type);
    if (template) {
      console.log(
        `🎯 Applying existing template to new furniture ${id} of type ${type}:`,
        template,
      );

      if (template.scale) {
        furnitureObject.scale.set(
          template.scale.x,
          template.scale.y,
          template.scale.z,
        );
        console.log(`  📐 Applied template scale:`, template.scale);
      }

      if (template.material) {
        this.applyMaterialToObject(furnitureObject, template.material);
        console.log(`  🎨 Applied template material:`, template.material);
      }
    }
  }

  public getFurnitureById(id: string): FurnitureItem | undefined {
    return this.furniture.get(id);
  }

  public getAllFurniture(): FurnitureItem[] {
    return Array.from(this.furniture.values());
  }

  public moveFurniture(id: string, position: THREE.Vector3): boolean {
    const item = this.furniture.get(id);
    if (!item || !item.canMove) return false;

    // Constrain movement to room bounds
    const constrainedPosition = this.constrainPosition(position);
    item.object.position.copy(constrainedPosition);
    return true;
  }

  public rotateFurniture(id: string, rotation: number): boolean {
    const item = this.furniture.get(id);
    if (!item || !item.canRotate) return false;

    item.object.rotation.y += rotation;
    return true;
  }

  public scaleFurniture(id: string, scale: number): boolean {
    const item = this.furniture.get(id);
    if (!item || !item.canScale) return false;

    const currentScale = item.object.scale.x;
    const newScale = Math.max(0.5, Math.min(2.0, currentScale * scale));

    item.object.scale.setScalar(newScale);
    return true;
  }

  // Public methods for external use (called from RoomExperience)
  public moveObject(id: string, position: THREE.Vector3): void {
    this.moveFurniture(id, position);
  }

  public rotateObject(id: string, rotation: number): void {
    this.rotateFurniture(id, rotation);
  }

  public scaleObject(id: string, scale: number): void {
    this.scaleFurniture(id, scale);
  }

  private constrainPosition(position: THREE.Vector3): THREE.Vector3 {
    const roomSize = 10; // Half of room size (20/2)
    const margin = 1; // Keep furniture away from walls

    return new THREE.Vector3(
      Math.max(-roomSize + margin, Math.min(roomSize - margin, position.x)),
      Math.max(0, position.y),
      Math.max(-roomSize + margin, Math.min(roomSize - margin, position.z)),
    );
  }

  public getFurnitureAt(raycaster: THREE.Raycaster): string | null {
    const intersects = raycaster.intersectObjects(
      this.furnitureGroup.children,
      true,
    );

    for (const intersect of intersects) {
      let object = intersect.object;

      // Traverse up to find the furniture root object
      while (object.parent && object.parent !== this.furnitureGroup) {
        object = object.parent;
      }

      if (object.userData?.id) {
        return object.userData.id;
      }
    }

    return null;
  }

  public highlightFurniture(id: string | null): void {
    // Remove previous highlights
    this.furnitureGroup.children.forEach((child) => {
      this.removeHighlight(child);
    });

    // Add highlight to selected furniture
    if (id) {
      const item = this.furniture.get(id);
      if (item) {
        this.addHighlight(item.object);
      }
    }
  }

  private addHighlight(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Store original material
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }

        // Apply highlight material
        if (Array.isArray(child.material)) {
          child.material = child.material.map((mat) => {
            const highlightMaterial = mat.clone();
            highlightMaterial.emissive.setHex(0x444444);
            return highlightMaterial;
          });
        } else {
          const highlightMaterial = child.material.clone();
          highlightMaterial.emissive.setHex(0x444444);
          child.material = highlightMaterial;
        }
      }
    });
  }

  private removeHighlight(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
        child.material = child.userData.originalMaterial;
        delete child.userData.originalMaterial;
      }
    });
  }

  public getFurnitureGroup(): THREE.Group {
    return this.furnitureGroup;
  }

  // Admin control methods for detailed furniture manipulation
  public updateFurnitureScale(
    id: string,
    scale: { x: number; y: number; z: number },
  ): boolean {
    const item = this.furniture.get(id);
    if (!item) {
      console.warn(`❌ updateFurnitureScale: furniture ${id} not found`);
      return false;
    }

    console.log(`📐 updateFurnitureScale: ${id}`, {
      currentScale: {
        x: item.object.scale.x,
        y: item.object.scale.y,
        z: item.object.scale.z,
      },
      newScale: scale,
      furnitureType: item.type,
    });

    // Update the template for this furniture type
    this.updateFurnitureTemplate(item.type, { scale });

    // Apply scale to ALL instances of this furniture type
    this.applyTemplateToAllInstances(item.type);

    return true;
  }

  public updateFurnitureTemplate(
    furnitureType: string,
    modifications: {
      scale?: { x: number; y: number; z: number };
      material?: {
        roughness: number;
        metalness: number;
        color: string;
        emissive: string;
      };
    },
  ): void {
    console.log(
      `🎯 Updating template for furniture type: ${furnitureType}`,
      modifications,
    );

    let template = this.furnitureTemplates.get(furnitureType) || {};

    if (modifications.scale) {
      template.scale = modifications.scale;
    }

    if (modifications.material) {
      template.material = modifications.material;
    }

    this.furnitureTemplates.set(furnitureType, template);
    console.log(`💾 Template updated for ${furnitureType}:`, template);
  }

  public applyTemplateToAllInstances(furnitureType: string): void {
    const template = this.furnitureTemplates.get(furnitureType);
    if (!template) return;

    console.log(
      `🌐 Applying template to all instances of type: ${furnitureType}`,
    );

    let instanceCount = 0;
    this.furniture.forEach((item, itemId) => {
      if (item.type === furnitureType) {
        instanceCount++;
        console.log(`  🔄 Updating instance: ${itemId}`);

        // Apply scale if defined in template
        if (template.scale) {
          item.object.scale.set(
            template.scale.x,
            template.scale.y,
            template.scale.z,
          );
          console.log(`    📐 Applied scale:`, template.scale);
        }

        // Apply material if defined in template
        if (template.material) {
          this.applyMaterialToObject(item.object, template.material);
          console.log(`    🎨 Applied material:`, template.material);
        }
      }
    });

    console.log(
      `✅ Applied template to ${instanceCount} instances of ${furnitureType}`,
    );
  }

  private applyMaterialToObject(
    object: THREE.Object3D,
    materialProps: {
      roughness: number;
      metalness: number;
      color: string;
      emissive: string;
    },
  ): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.roughness = materialProps.roughness;
              material.metalness = materialProps.metalness;
              material.color.setStyle(materialProps.color);
              material.emissive.setStyle(materialProps.emissive);
              material.needsUpdate = true;
            }
          });
        } else {
          const material = child.material as THREE.MeshStandardMaterial;
          material.roughness = materialProps.roughness;
          material.metalness = materialProps.metalness;
          material.color.setStyle(materialProps.color);
          material.emissive.setStyle(materialProps.emissive);
          material.needsUpdate = true;
        }
      }
    });
  }

  public updateFurnitureRotation(
    id: string,
    rotation: { x: number; y: number; z: number },
  ): boolean {
    const item = this.furniture.get(id);
    if (!item) return false;

    // Convert degrees to radians
    item.object.rotation.set(
      (rotation.x * Math.PI) / 180,
      (rotation.y * Math.PI) / 180,
      (rotation.z * Math.PI) / 180,
    );
    return true;
  }

  public updateFurniturePosition(
    id: string,
    position: { x: number; y: number; z: number },
  ): boolean {
    const item = this.furniture.get(id);
    if (!item) return false;

    console.log(
      `🔄 Updating furniture ${id} position from (${item.object.position.x}, ${item.object.position.y}, ${item.object.position.z}) to (${position.x}, ${position.y}, ${position.z})`,
    );
    item.object.position.set(position.x, position.y, position.z);
    return true;
  }

  public updateFurnitureMaterial(
    id: string,
    materialProps: {
      roughness?: number;
      metalness?: number;
      color?: string;
      emissive?: string;
    },
  ): boolean {
    console.log(`🎨 Updating material for furniture ${id}:`, materialProps);
    const item = this.furniture.get(id);
    if (!item) {
      console.warn(`❌ Furniture ${id} not found for material update`);
      return false;
    }

    // Create complete material object for template
    const currentMaterial = this.getFurnitureProperties(id)?.material || {
      roughness: 0.5,
      metalness: 0,
      color: "#ffffff",
      emissive: "#000000",
    };

    const updatedMaterial = {
      roughness: materialProps.roughness ?? currentMaterial.roughness,
      metalness: materialProps.metalness ?? currentMaterial.metalness,
      color: materialProps.color ?? currentMaterial.color,
      emissive: materialProps.emissive ?? currentMaterial.emissive,
    };

    console.log(
      `🎯 Updating template for type: ${item.type} with material:`,
      updatedMaterial,
    );

    // Update the template for this furniture type
    this.updateFurnitureTemplate(item.type, { material: updatedMaterial });

    // Apply to ALL instances of this furniture type
    this.applyTemplateToAllInstances(item.type);

    return true;
  }

  public getFurnitureProperties(id: string): {
    scale: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
    material?: {
      roughness: number;
      metalness: number;
      color: string;
      emissive: string;
    };
  } | null {
    const item = this.furniture.get(id);
    if (!item) return null;

    const obj = item.object;
    let material = null;

    // Get material properties from first mesh found
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && !material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        material = {
          roughness: mat.roughness || 0.5,
          metalness: mat.metalness || 0,
          color: "#" + mat.color.getHexString(),
          emissive: "#" + mat.emissive.getHexString(),
        };
      }
    });

    return {
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
      rotation: {
        x: (obj.rotation.x * 180) / Math.PI,
        y: (obj.rotation.y * 180) / Math.PI,
        z: (obj.rotation.z * 180) / Math.PI,
      },
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      material,
    };
  }

  public resetFurnitureToDefaults(id: string): boolean {
    const item = this.furniture.get(id);
    if (!item) return false;

    console.log(`🔄 Resetting furniture to defaults: ${id} (${item.type})`);

    // Clear the template for this furniture type so all instances reset
    console.log(`🗑️ Clearing template for furniture type: ${item.type}`);
    this.furnitureTemplates.delete(item.type);

    // Reset ALL instances of this furniture type to original state
    this.resetAllInstancesOfType(item.type);

    return true;
  }

  private resetAllInstancesOfType(furnitureType: string): void {
    console.log(`🌐 Resetting ALL instances of type: ${furnitureType}`);

    let instanceCount = 0;
    this.furniture.forEach((item, itemId) => {
      if (item.type === furnitureType) {
        instanceCount++;
        console.log(`  🔄 Resetting instance: ${itemId}`);

        // Reset scale to original
        item.object.scale.copy(item.originalScale);
        console.log(`    📐 Reset scale to original:`, {
          x: item.originalScale.x,
          y: item.originalScale.y,
          z: item.originalScale.z,
        });

        // Reset materials to original
        this.resetMaterialProperties(item.object, itemId);
        console.log(`    🎨 Reset materials to original`);
      }
    });

    console.log(
      `✅ Reset ${instanceCount} instances of ${furnitureType} to original state`,
    );
  }

  // Debug method to get cache keys
  public getCacheKeys(): string[] {
    return this.furnitureFactory.getCacheKeys();
  }

  // Clear all furniture from the room
  public clearAllFurniture(): void {
    console.log(
      `🗑️ Clearing all furniture from room (${this.furniture.size} items)`,
    );

    // Remove all furniture from scene
    this.furniture.forEach((item, id) => {
      console.log(`🗑️ Removing furniture: ${id}`);
      this.furnitureGroup.remove(item.object);

      // Remove associated lights if any
      if (this.furnitureLights.has(id)) {
        const light = this.furnitureLights.get(id)!;
        this.scene.remove(light);
        this.furnitureLights.delete(id);
      }
    });

    // Clear furniture map
    this.furniture.clear();
    console.log("✅ All furniture cleared from room");
  }

  private resetCustomFurnitureToOriginal(
    id: string,
    item: FurnitureItem,
  ): void {
    try {
      console.log(`🔄 Starting reset for custom furniture: ${id}`);
      console.log(`🏷️ Item type: ${item.type}`);

      // Get the original cached model - extract the base furniture ID
      let furnitureId = item.type.replace("custom_", "");

      // If the item has userData with originalStoreId, use that instead
      if (item.object.userData?.originalStoreId) {
        furnitureId = item.object.userData.originalStoreId;
        console.log(`🔍 Using originalStoreId from userData: ${furnitureId}`);
      }

      console.log(`🎯 Looking for cached model with ID: ${furnitureId}`);

      const originalModel = this.furnitureFactory.getFromCache(furnitureId);
      console.log(
        `📦 Cache lookup result:`,
        originalModel ? "FOUND" : "NOT FOUND",
      );

      if (originalModel) {
        console.log(`📦 Found cached original model for: ${furnitureId}`);
        console.log(`📐 Original model scale:`, originalModel.scale);

        // Store current position
        const currentPosition = item.object.position.clone();
        console.log(`📍 Current position:`, currentPosition);

        // Remove current object from scene
        this.furnitureGroup.remove(item.object);
        console.log(`🗑️ Removed current object from scene`);

        // Store current userData to preserve it
        const currentUserData = { ...item.object.userData };
        console.log(`💾 Preserving userData:`, currentUserData);

        // Clone the original model
        const resetObject = originalModel.clone();
        resetObject.position.copy(currentPosition); // Keep current position

        // Restore userData with all original information
        resetObject.userData = {
          id,
          type: item.type,
          ...currentUserData, // Preserve originalName, originalStoreId, etc.
        };

        console.log(`✅ Restored userData:`, resetObject.userData);

        console.log(`📐 Reset object scale:`, resetObject.scale);
        console.log(`📍 Reset object position:`, resetObject.position);

        // Update the furniture item
        item.object = resetObject;
        item.originalScale = resetObject.scale.clone();

        // Update the original materials map to point to the new cloned meshes
        const newOriginalMaterials = new Map();
        resetObject.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            // Find corresponding original material properties
            if (Array.isArray(child.material)) {
              const mat = child.material[0] as THREE.MeshStandardMaterial;
              if (mat) {
                newOriginalMaterials.set(child, {
                  roughness: mat.roughness || 0.5,
                  metalness: mat.metalness || 0,
                  color: "#" + mat.color.getHexString(),
                  emissive: "#" + mat.emissive.getHexString(),
                });
              }
            } else {
              const mat = child.material as THREE.MeshStandardMaterial;
              newOriginalMaterials.set(child, {
                roughness: mat.roughness || 0.5,
                metalness: mat.metalness || 0,
                color: "#" + mat.color.getHexString(),
                emissive: "#" + mat.emissive.getHexString(),
              });
            }
          }
        });

        item.originalMaterials = newOriginalMaterials;
        console.log(
          `🎨 Updated original materials for cloned object:`,
          Array.from(newOriginalMaterials.values()),
        );

        // Add back to scene
        this.furnitureGroup.add(resetObject);

        console.log(`✅ Successfully reset custom furniture: ${id}`);
      } else {
        console.warn(`⚠️ No cached model found for ${furnitureId}`);
        console.log(
          `🧰 Available cache keys:`,
          Array.from(this.furnitureFactory.getCacheKeys()),
        );
        console.log(
          `⬇️ Falling back to material-only reset for custom furniture`,
        );
        // For custom furniture without cache, just reset materials and scale
        this.resetCustomFurnitureMaterialsOnly(item);
      }
    } catch (error) {
      console.error(`❌ Error resetting custom furniture ${id}:`, error);
      this.resetCustomFurnitureMaterialsOnly(item);
    }
  }

  private resetBuiltInFurnitureToDefaults(item: FurnitureItem): void {
    console.log(`🔄 Resetting built-in furniture: ${item.id}`);

    // Reset to original scale (stored when created)
    item.object.scale.copy(item.originalScale);
    item.object.rotation.set(0, 0, 0);
    // Keep current position - don't reset to (0,0,0)

    // Reset material properties for built-in furniture
    this.resetMaterialProperties(item.object, item.id);
    console.log(`✅ Built-in furniture reset completed: ${item.id}`);
  }

  private resetCustomFurnitureMaterialsOnly(item: FurnitureItem): void {
    console.log(
      `🎨 Resetting custom furniture materials and scale only: ${item.id}`,
    );

    // Reset to original scale (stored when created)
    item.object.scale.copy(item.originalScale);
    item.object.rotation.set(0, 0, 0);
    // Keep current position - don't reset to (0,0,0)

    // Reset material properties for custom furniture
    this.resetMaterialProperties(item.object, item.id);
    console.log(`✅ Custom furniture materials reset completed: ${item.id}`);
  }

  private resetMaterialProperties(
    object: THREE.Object3D,
    furnitureId?: string,
  ): void {
    console.log(
      `🎨 Resetting material properties for object (furniture: ${furnitureId})`,
    );
    let meshCount = 0;

    // Try to get the furniture item to access original materials
    const furnitureItem = furnitureId ? this.furniture.get(furnitureId) : null;

    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        meshCount++;

        // Try to get original material properties for this mesh
        const originalMaterial = furnitureItem?.originalMaterials.get(child);

        // Handle both single materials and material arrays
        if (Array.isArray(child.material)) {
          console.log(
            `🔧 Resetting material array for mesh ${meshCount} (${child.material.length} materials)`,
          );
          child.material.forEach((material, index) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              console.log(
                `   📝 Resetting material ${index + 1}/${child.material.length}:`,
                {
                  oldRoughness: material.roughness,
                  oldMetalness: material.metalness,
                  oldColor: material.color.getHexString(),
                  oldEmissive: material.emissive.getHexString(),
                  originalMaterial,
                },
              );

              // Use original material properties if available, otherwise use defaults
              material.roughness = originalMaterial?.roughness ?? 0.5;
              material.metalness = originalMaterial?.metalness ?? 0;
              material.color.setStyle(originalMaterial?.color ?? "#ffffff");
              material.emissive.setStyle(
                originalMaterial?.emissive ?? "#000000",
              );
              material.needsUpdate = true;

              console.log(`   ✅ Material ${index + 1} reset to original:`, {
                newRoughness: material.roughness,
                newMetalness: material.metalness,
                newColor: material.color.getHexString(),
                newEmissive: material.emissive.getHexString(),
              });
            }
          });
        } else {
          const material = child.material as THREE.MeshStandardMaterial;
          console.log(`🔧 Resetting single material for mesh ${meshCount}:`, {
            oldRoughness: material.roughness,
            oldMetalness: material.metalness,
            oldColor: material.color.getHexString(),
            oldEmissive: material.emissive.getHexString(),
            originalMaterial,
          });

          // Use original material properties if available, otherwise use defaults
          material.roughness = originalMaterial?.roughness ?? 0.5;
          material.metalness = originalMaterial?.metalness ?? 0;
          material.color.setStyle(originalMaterial?.color ?? "#ffffff");
          material.emissive.setStyle(originalMaterial?.emissive ?? "#000000");
          material.needsUpdate = true;

          console.log(`✅ Material reset for mesh ${meshCount} to original:`, {
            newRoughness: material.roughness,
            newMetalness: material.metalness,
            newColor: material.color.getHexString(),
            newEmissive: material.emissive.getHexString(),
          });
        }
      }
    });

    console.log(`📊 Total meshes with materials reset: ${meshCount}`);
  }

  // Inventory management methods
  public removeFurniture(id: string): boolean {
    const item = this.furniture.get(id);
    if (!item) return false;

    // Remove associated light if it's a lamp
    if (id.includes("lamp") && this.furnitureLights.has(id)) {
      const light = this.furnitureLights.get(id)!;
      this.scene.remove(light);
      this.furnitureLights.delete(id);
    }

    // Remove from scene
    this.furnitureGroup.remove(item.object);

    // Only dispose resources for built-in furniture, not custom GLB furniture
    // Custom GLB furniture uses cached models that should not be disposed
    const isCustomFurniture =
      item.type.startsWith("custom_") ||
      (!item.type.startsWith("custom_") &&
        ![
          "sofa",
          "table",
          "diningTable",
          "chair",
          "bookshelf",
          "lamp",
          "tableLamp",
          "plant",
          "tvStand",
          "sideTable",
          "wallShelf",
          "pictureFrame",
          "wallClock",
          "pendantLight",
        ].includes(item.type));

    if (!isCustomFurniture) {
      // Dispose of geometry and materials only for built-in furniture
      item.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }

    // Remove from furniture map
    this.furniture.delete(id);
    return true;
  }

  // Create temporary furniture for thumbnail generation (doesn't add to scene)
  public async createTemporaryFurnitureForThumbnail(
    furnitureType: string,
  ): Promise<THREE.Object3D | null> {
    console.log(
      `🖼️ Creating temporary furniture for thumbnail: ${furnitureType}`,
    );

    try {
      // Create the furniture object using the factory
      const furnitureObject = await this.furnitureFactory.create(furnitureType);

      if (!furnitureObject) {
        console.warn(
          `❌ Failed to create temporary furniture of type: ${furnitureType}`,
        );
        return null;
      }

      // Don't add to scene or furniture map - just return the object for thumbnail generation
      console.log(
        `✅ Temporary furniture created successfully: ${furnitureType}`,
      );
      return furnitureObject;
    } catch (error) {
      console.error(`Error creating temporary furniture for thumbnail:`, error);
      return null;
    }
  }

  public async addFurnitureFromInventory(
    id: string,
    position: THREE.Vector3,
    type?: string,
  ): Promise<boolean> {
    console.log(
      `🏠 FurnitureManager.addFurnitureFromInventory called: ID=${id}, Type=${type}`,
    );

    // Check if furniture already exists
    if (this.furniture.has(id)) {
      console.warn(`❌ Furniture with id ${id} already exists`);
      return false;
    }

    // Use provided type if available, otherwise infer from id
    let furnitureType = type;

    if (!furnitureType) {
      console.log(`🔍 No type provided, inferring from id: ${id}`);

      // First, check if this is a custom furniture GLB by checking if it exists in the custom furniture list
      try {
        const customFurniture =
          await this.furnitureFactory.getCustomFurnitureList();
        const matchingCustom = customFurniture.find((f) => f.id === id);

        if (matchingCustom) {
          console.log(`🎯 Found custom furniture: ${matchingCustom.name}`);
          furnitureType = `custom_${id}`;
        } else {
          // Extract type from id (assumes format like "sofa", "coffee-table", etc.)
          furnitureType = id.split("-")[0]; // Get first part of hyphenated id

          // Map some common ids to furniture types
          const typeMapping: { [key: string]: string } = {
            coffee: "table",
            dining: "diningTable",
            side: "sideTable",
            floor: "lamp",
            table: "tableLamp",
            pendant: "pendantLight",
            picture: "pictureFrame",
            wall: id.includes("shelf")
              ? "wallShelf"
              : id.includes("clock")
                ? "wallClock"
                : "wall",
            tv: "tvStand",
            premium: "sofa", // Premium sofa maps to regular sofa
            crystal: "lamp", // Crystal lamp maps to regular lamp
          };

          if (typeMapping[furnitureType]) {
            furnitureType = typeMapping[furnitureType];
          }

          // Get available types asynchronously
          const availableTypes =
            await this.furnitureFactory.getAvailableTypes();

          // If still no match, try to infer from the full id
          if (!availableTypes.includes(furnitureType)) {
            if (id.includes("sofa")) furnitureType = "sofa";
            else if (id.includes("lamp")) furnitureType = "lamp";
            else if (id.includes("table")) furnitureType = "table";
            else if (id.includes("chair")) furnitureType = "chair";
            else furnitureType = "table"; // Default fallback
          }
        }
      } catch (error) {
        console.error("Error checking custom furniture:", error);
        // Fallback to original logic
        furnitureType = id.split("-")[0];
      }
    }

    console.log(`🏠 Creating furniture - ID: ${id}, Type: ${furnitureType}`);

    // Create the furniture
    await this.addFurniture(id, furnitureType, position, 0);
    return true;
  }

  // Template management methods
  public getFurnitureTemplate(furnitureType: string):
    | {
        scale?: { x: number; y: number; z: number };
        material?: {
          roughness: number;
          metalness: number;
          color: string;
          emissive: string;
        };
      }
    | undefined {
    return this.furnitureTemplates.get(furnitureType);
  }

  public setFurnitureTemplate(
    furnitureType: string,
    template: {
      scale?: { x: number; y: number; z: number };
      material?: {
        roughness: number;
        metalness: number;
        color: string;
        emissive: string;
      };
    },
  ): void {
    this.furnitureTemplates.set(furnitureType, template);
    console.log(`💾 Set template for ${furnitureType}:`, template);
  }

  public getAllTemplates(): Map<
    string,
    {
      scale?: { x: number; y: number; z: number };
      material?: {
        roughness: number;
        metalness: number;
        color: string;
        emissive: string;
      };
    }
  > {
    return new Map(this.furnitureTemplates);
  }

  // Toggle furniture light (for lamps)
  public toggleFurnitureLight(objectId: string, isOn: boolean): void {
    const furniture = this.furniture.get(objectId);
    if (!furniture || !objectId.includes("lamp")) return;

    if (isOn) {
      // Create and add light if it doesn't exist
      if (!this.furnitureLights.has(objectId)) {
        const light = new THREE.PointLight(0xffffff, 1.5, 12, 2); // White light
        light.position.copy(furniture.object.position);
        light.position.y += 1.5; // Position above the lamp
        light.castShadow = true;
        light.shadow.mapSize.width = 512;
        light.shadow.mapSize.height = 512;
        light.shadow.bias = -0.0001;

        this.furnitureLights.set(objectId, light);
        this.scene.add(light);
      } else {
        // Enable existing light
        const light = this.furnitureLights.get(objectId)!;
        light.intensity = 1.5;
      }
    } else {
      // Disable light
      const light = this.furnitureLights.get(objectId);
      if (light) {
        light.intensity = 0;
      }
    }
  }
}
