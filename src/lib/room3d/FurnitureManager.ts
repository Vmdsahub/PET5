import * as THREE from "three";
import { FurnitureFactory } from "./FurnitureFactory";

interface FurnitureItem {
  id: string;
  object: THREE.Object3D;
  type: string;
  originalScale: THREE.Vector3;
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
    // Create a cozy living room setup
    await this.addFurniture("sofa", "sofa", new THREE.Vector3(-5, 0, 3), 0);
    await this.addFurniture(
      "coffee-table",
      "table",
      new THREE.Vector3(-3, 0, 1),
      0,
    );
    await this.addFurniture(
      "bookshelf",
      "bookshelf",
      new THREE.Vector3(-9.5, 0, -5),
      Math.PI / 2,
    );
    await this.addFurniture(
      "floor-lamp",
      "lamp",
      new THREE.Vector3(-7, 0, 4),
      0,
    );
    await this.addFurniture(
      "dining-table",
      "diningTable",
      new THREE.Vector3(4, 0, -3),
      0,
    );
    await this.addFurniture(
      "chair-1",
      "chair",
      new THREE.Vector3(5, 0, -1.5),
      Math.PI,
    );
    await this.addFurniture(
      "chair-2",
      "chair",
      new THREE.Vector3(3, 0, -1.5),
      Math.PI,
    );
    await this.addFurniture("plant", "plant", new THREE.Vector3(8, 0, 6), 0);
    await this.addFurniture(
      "tv-stand",
      "tvStand",
      new THREE.Vector3(0, 0, -9.5),
      0,
    );
    await this.addFurniture(
      "side-table",
      "sideTable",
      new THREE.Vector3(-8, 0, 1),
      0,
    );

    // Wall furniture
    await this.addFurniture(
      "wall-shelf",
      "wallShelf",
      new THREE.Vector3(5, 5, -9.8),
      0,
    );
    await this.addFurniture(
      "picture-frame",
      "pictureFrame",
      new THREE.Vector3(-3, 6, -9.8),
      0,
    );
    await this.addFurniture(
      "wall-clock",
      "wallClock",
      new THREE.Vector3(3, 7, -9.8),
      0,
    );

    // Lighting fixtures
    await this.addFurniture(
      "table-lamp",
      "tableLamp",
      new THREE.Vector3(-8, 1.2, 1),
      0,
    );
    await this.addFurniture(
      "pendant-light",
      "pendantLight",
      new THREE.Vector3(4, 8, -3),
      0,
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

    const furnitureItem: FurnitureItem = {
      id,
      object: furnitureObject,
      type,
      originalScale: furnitureObject.scale.clone(),
      canMove: true,
      canRotate: true,
      canScale: true,
    };

    this.furniture.set(id, furnitureItem);
    this.furnitureGroup.add(furnitureObject);
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
    if (!item) return false;

    item.object.scale.set(scale.x, scale.y, scale.z);
    return true;
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

    let meshCount = 0;
    item.object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        meshCount++;
        const material = child.material as THREE.MeshStandardMaterial;
        console.log(`🔧 Updating mesh ${meshCount} material:`, {
          oldRoughness: material.roughness,
          oldMetalness: material.metalness,
          newProps: materialProps,
        });

        if (materialProps.roughness !== undefined) {
          material.roughness = materialProps.roughness;
        }
        if (materialProps.metalness !== undefined) {
          material.metalness = materialProps.metalness;
        }
        if (materialProps.color !== undefined) {
          material.color.setStyle(materialProps.color);
        }
        if (materialProps.emissive !== undefined) {
          material.emissive.setStyle(materialProps.emissive);
        }

        material.needsUpdate = true;
        console.log(`✅ Material updated:`, {
          roughness: material.roughness,
          metalness: material.metalness,
          color: material.color.getHexString(),
          emissive: material.emissive.getHexString(),
        });
      }
    });

    console.log(`📊 Total meshes updated: ${meshCount}`);
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

    // For custom GLB furniture, reload from cache to get original state
    if (item.type.startsWith("custom_")) {
      console.log(`🎯 Resetting custom GLB furniture: ${id}`);
      this.resetCustomFurnitureToOriginal(id, item);
    } else {
      console.log(`🏠 Resetting built-in furniture: ${id}`);
      this.resetBuiltInFurnitureToDefaults(item);
    }

    return true;
  }

  // Debug method to get cache keys
  public getCacheKeys(): string[] {
    return this.furnitureFactory.getCacheKeys();
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

        // Clone the original model
        const resetObject = originalModel.clone();
        resetObject.position.copy(currentPosition); // Keep current position
        resetObject.userData = { id, type: item.type }; // Restore userData

        console.log(`📐 Reset object scale:`, resetObject.scale);
        console.log(`📍 Reset object position:`, resetObject.position);

        // Update the furniture item
        item.object = resetObject;
        item.originalScale = resetObject.scale.clone();

        // Add back to scene
        this.furnitureGroup.add(resetObject);

        console.log(`✅ Successfully reset custom furniture: ${id}`);
      } else {
        console.warn(`⚠️ No cached model found for ${furnitureId}`);
        console.log(
          `🧰 Available cache keys:`,
          Array.from(this.furnitureFactory.getCacheKeys()),
        );
        console.log(`⬇️ Falling back to basic reset`);
        this.resetBuiltInFurnitureToDefaults(item);
      }
    } catch (error) {
      console.error(`❌ Error resetting custom furniture ${id}:`, error);
      this.resetBuiltInFurnitureToDefaults(item);
    }
  }

  private resetBuiltInFurnitureToDefaults(item: FurnitureItem): void {
    // Reset to original scale (stored when created)
    item.object.scale.copy(item.originalScale);
    item.object.rotation.set(0, 0, 0);
    // Keep current position - don't reset to (0,0,0)

    // Reset material properties for built-in furniture only
    item.object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        material.roughness = 0.5;
        material.metalness = 0;
        material.color.setStyle("#ffffff");
        material.emissive.setStyle("#000000");
        material.needsUpdate = true;
      }
    });
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
