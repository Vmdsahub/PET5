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

    this.createDefaultFurniture();
  }

  private createDefaultFurniture(): void {
    // Create a cozy living room setup
    this.addFurniture("sofa", "sofa", new THREE.Vector3(-5, 0, 3), 0);
    this.addFurniture("coffee-table", "table", new THREE.Vector3(-3, 0, 1), 0);
    this.addFurniture(
      "bookshelf",
      "bookshelf",
      new THREE.Vector3(-9.5, 0, -5),
      Math.PI / 2,
    );
    this.addFurniture("floor-lamp", "lamp", new THREE.Vector3(-7, 0, 4), 0);
    this.addFurniture(
      "dining-table",
      "diningTable",
      new THREE.Vector3(4, 0, -3),
      0,
    );
    this.addFurniture(
      "chair-1",
      "chair",
      new THREE.Vector3(5, 0, -1.5),
      Math.PI,
    );
    this.addFurniture(
      "chair-2",
      "chair",
      new THREE.Vector3(3, 0, -1.5),
      Math.PI,
    );
    this.addFurniture("plant", "plant", new THREE.Vector3(8, 0, 6), 0);
    this.addFurniture("tv-stand", "tvStand", new THREE.Vector3(0, 0, -9.5), 0);
    this.addFurniture(
      "side-table",
      "sideTable",
      new THREE.Vector3(-8, 0, 1),
      0,
    );

    // Wall furniture
    this.addFurniture(
      "wall-shelf",
      "wallShelf",
      new THREE.Vector3(5, 5, -9.8),
      0,
    );
    this.addFurniture(
      "picture-frame",
      "pictureFrame",
      new THREE.Vector3(-3, 6, -9.8),
      0,
    );
    this.addFurniture(
      "wall-clock",
      "wallClock",
      new THREE.Vector3(3, 7, -9.8),
      0,
    );

    // Lighting fixtures
    this.addFurniture(
      "table-lamp",
      "tableLamp",
      new THREE.Vector3(-8, 1.2, 1),
      0,
    );
    this.addFurniture(
      "pendant-light",
      "pendantLight",
      new THREE.Vector3(4, 8, -3),
      0,
    );
  }

  private addFurniture(
    id: string,
    type: string,
    position: THREE.Vector3,
    rotationY: number = 0,
  ): void {
    const furnitureObject = this.furnitureFactory.create(type);

    if (!furnitureObject) {
      console.warn(`Failed to create furniture of type: ${type}`);
      return;
    }

    furnitureObject.position.copy(position);
    furnitureObject.rotation.y = rotationY;
    furnitureObject.userData = { id, type };

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

    // Dispose of geometry and materials to free memory
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

    // Remove from furniture map
    this.furniture.delete(id);
    return true;
  }

  public addFurnitureFromInventory(
    id: string,
    position: THREE.Vector3,
  ): boolean {
    // Check if furniture already exists
    if (this.furniture.has(id)) {
      console.warn(`Furniture with id ${id} already exists`);
      return false;
    }

    // Extract type from id (assumes format like "sofa", "coffee-table", etc.)
    let type = id.split("-")[0]; // Get first part of hyphenated id

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
    };

    if (typeMapping[type]) {
      type = typeMapping[type];
    }

    // Create the furniture
    this.addFurniture(id, type, position, 0);
    return true;
  }

  // Toggle furniture light (for lamps)
  public toggleFurnitureLight(objectId: string, isOn: boolean): void {
    const furniture = this.furniture.get(objectId);
    if (!furniture || !objectId.includes("lamp")) return;

    if (isOn) {
      // Create and add light if it doesn't exist
      if (!this.furnitureLights.has(objectId)) {
        const light = new THREE.PointLight(0xffeb3b, 2, 15, 2); // Bright yellow light
        light.position.copy(furniture.object.position);
        light.position.y += 2; // Position above the lamp
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.bias = -0.0001;

        this.furnitureLights.set(objectId, light);
        this.scene.add(light);
      } else {
        // Enable existing light
        const light = this.furnitureLights.get(objectId)!;
        light.intensity = 2;
      }

      // Add visual glow effect to the lamp
      this.addLampGlow(furniture.object);
    } else {
      // Disable light
      const light = this.furnitureLights.get(objectId);
      if (light) {
        light.intensity = 0;
      }

      // Remove glow effect
      this.removeLampGlow(furniture.object);
    }
  }

  private addLampGlow(lampObject: THREE.Object3D): void {
    // Add a glowing effect to the lamp bulb/shade
    lampObject.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Store original material if not already stored
        if (!child.userData.originalEmissive) {
          child.userData.originalEmissive =
            child.material.emissive?.clone() || new THREE.Color(0x000000);
        }

        // Add emissive glow
        if (child.material.emissive) {
          child.material.emissive.setHex(0xffeb3b);
          child.material.emissiveIntensity = 0.3;
        }
      }
    });
  }

  private removeLampGlow(lampObject: THREE.Object3D): void {
    // Remove glowing effect from the lamp
    lampObject.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.originalEmissive) {
        // Restore original emissive color
        if (child.material.emissive) {
          child.material.emissive.copy(child.userData.originalEmissive);
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }
}
