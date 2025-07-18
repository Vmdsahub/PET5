import * as THREE from "three";

export class RoomWorld {
  private scene: THREE.Scene;
  private roomGroup: THREE.Group;
  private materials: { [key: string]: THREE.Material };
  private roomSize: number = 20;
  private roomHeight: number = 10;
  private wallThickness: number = 0.2;
  private floorThickness: number = 0.2;
  private ceilingThickness: number = 0.2;

  // Individual dimensions for each element
  private floorWidth: number = 20;
  private floorDepth: number = 20;
  private ceilingWidth: number = 20;
  private ceilingDepth: number = 20;
  private backWallWidth: number = 20;
  private backWallHeight: number = 10;
  private leftWallDepth: number = 20;
  private leftWallHeight: number = 10;
  private rightWallDepth: number = 20;
  private rightWallHeight: number = 10;

  // Default values for reset functionality
  private readonly defaultDimensions = {
    floorWidth: 20,
    floorDepth: 20,
    ceilingWidth: 20,
    ceilingDepth: 20,
    backWallWidth: 20,
    backWallHeight: 10,
    leftWallDepth: 20,
    leftWallHeight: 10,
    rightWallDepth: 20,
    rightWallHeight: 10,
    wallThickness: 0.2,
    floorThickness: 0.2,
    ceilingThickness: 0.2,
  };

  private readonly defaultMaterials = {
    floor: { color: "#8B7355", roughness: 0.8, metalness: 0.1 },
    wall: { color: "#F5F5F0", roughness: 0.9, metalness: 0.05 },
    ceiling: { color: "#FFFFFF", roughness: 0.9, metalness: 0.02 },
    baseboard: { color: "#FFFFFF", roughness: 0.7, metalness: 0.1 },
  };
  private roomMeshes: { [key: string]: THREE.Mesh } = {};

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.roomGroup = new THREE.Group();
    this.scene.add(this.roomGroup);

    this.createMaterials();
    this.createRoom();
  }

  private createMaterials(): void {
    this.materials = {
      // Floor material with wood texture
      floor: new THREE.MeshStandardMaterial({
        color: "#8B7355",
        roughness: 0.8,
        metalness: 0.1,
      }),

      // Wall material with subtle texture
      wall: new THREE.MeshStandardMaterial({
        color: "#F5F5F0",
        roughness: 0.9,
        metalness: 0.05,
      }),

      // Ceiling material
      ceiling: new THREE.MeshStandardMaterial({
        color: "#FFFFFF",
        roughness: 0.9,
        metalness: 0.02,
      }),

      // Baseboard material
      baseboard: new THREE.MeshStandardMaterial({
        color: "#FFFFFF",
        roughness: 0.7,
        metalness: 0.1,
      }),
    };
  }

  private createRoom(): void {
    // Floor
    this.createFloor();

    // Walls
    this.createWalls();

    // Ceiling
    this.createCeiling();

    // Baseboards
    this.createBaseboards();
  }

  private createFloor(): void {
    const floorGeometry = new THREE.BoxGeometry(
      this.floorWidth,
      this.floorThickness,
      this.floorDepth,
    );
    const floor = new THREE.Mesh(floorGeometry, this.materials.floor);

    floor.position.y = -this.floorThickness / 2;
    floor.receiveShadow = true;
    floor.castShadow = true;

    this.roomMeshes.floor = floor;
    this.roomGroup.add(floor);
  }

  private createWalls(): void {
    const halfFloorWidth = this.floorWidth / 2;
    const halfFloorDepth = this.floorDepth / 2;
    const floorTop = 0; // Topo do chão está em y=0

    // Back wall - posicionada na borda do chão, voltada para dentro
    const backWallGeometry = new THREE.BoxGeometry(
      this.backWallWidth,
      this.backWallHeight,
      this.wallThickness,
    );
    const backWall = new THREE.Mesh(backWallGeometry, this.materials.wall);
    backWall.position.set(
      0,
      floorTop + this.backWallHeight / 2,
      -halfFloorDepth + this.wallThickness / 2,
    );
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.roomMeshes.backWall = backWall;
    this.roomGroup.add(backWall);

    // Left wall - posicionada na borda do chão, voltada para dentro
    const leftWallGeometry = new THREE.BoxGeometry(
      this.wallThickness,
      this.leftWallHeight,
      this.leftWallDepth,
    );
    const leftWall = new THREE.Mesh(leftWallGeometry, this.materials.wall);
    leftWall.position.set(
      -halfFloorWidth + this.wallThickness / 2,
      floorTop + this.leftWallHeight / 2,
      0,
    );
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.roomMeshes.leftWall = leftWall;
    this.roomGroup.add(leftWall);

    // Right wall - posicionada na borda do chão, voltada para dentro
    const rightWallGeometry = new THREE.BoxGeometry(
      this.wallThickness,
      this.rightWallHeight,
      this.rightWallDepth,
    );
    const rightWall = new THREE.Mesh(rightWallGeometry, this.materials.wall);
    rightWall.position.set(
      halfFloorWidth - this.wallThickness / 2,
      floorTop + this.rightWallHeight / 2,
      0,
    );
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.roomMeshes.rightWall = rightWall;
    this.roomGroup.add(rightWall);
  }

  private createCeiling(): void {
    const ceilingGeometry = new THREE.BoxGeometry(
      this.ceilingWidth,
      this.ceilingThickness,
      this.ceilingDepth,
    );
    const ceiling = new THREE.Mesh(ceilingGeometry, this.materials.ceiling);

    // Use the highest wall as reference for ceiling position
    const maxWallHeight = Math.max(
      this.backWallHeight,
      this.leftWallHeight,
      this.rightWallHeight,
    );
    ceiling.position.y = maxWallHeight + this.ceilingThickness / 2;
    ceiling.receiveShadow = true;
    ceiling.castShadow = true;

    this.roomMeshes.ceiling = ceiling;
    this.roomGroup.add(ceiling);
  }

  private createBaseboards(): void {
    const baseboardHeight = 0.3;
    const baseboardDepth = 0.1;
    const halfFloorWidth = this.floorWidth / 2;
    const halfFloorDepth = this.floorDepth / 2;
    const floorTop = 0;

    // Back baseboard - na frente da parede traseira
    const backBaseboardGeometry = new THREE.BoxGeometry(
      this.backWallWidth,
      baseboardHeight,
      baseboardDepth,
    );
    const backBaseboard = new THREE.Mesh(
      backBaseboardGeometry,
      this.materials.baseboard,
    );
    backBaseboard.position.set(
      0,
      floorTop + baseboardHeight / 2,
      -halfFloorDepth + this.wallThickness + baseboardDepth / 2,
    );
    backBaseboard.castShadow = true;
    this.roomMeshes.backBaseboard = backBaseboard;
    this.roomGroup.add(backBaseboard);

    // Left baseboard - na frente da parede esquerda
    const leftBaseboardGeometry = new THREE.BoxGeometry(
      baseboardDepth,
      baseboardHeight,
      this.leftWallDepth,
    );
    const leftBaseboard = new THREE.Mesh(
      leftBaseboardGeometry,
      this.materials.baseboard,
    );
    leftBaseboard.position.set(
      -halfFloorWidth + this.wallThickness + baseboardDepth / 2,
      floorTop + baseboardHeight / 2,
      0,
    );
    leftBaseboard.castShadow = true;
    this.roomMeshes.leftBaseboard = leftBaseboard;
    this.roomGroup.add(leftBaseboard);

    // Right baseboard - na frente da parede direita
    const rightBaseboardGeometry = new THREE.BoxGeometry(
      baseboardDepth,
      baseboardHeight,
      this.rightWallDepth,
    );
    const rightBaseboard = new THREE.Mesh(
      rightBaseboardGeometry,
      this.materials.baseboard,
    );
    rightBaseboard.position.set(
      halfFloorWidth - this.wallThickness - baseboardDepth / 2,
      floorTop + baseboardHeight / 2,
      0,
    );
    rightBaseboard.castShadow = true;
    this.roomMeshes.rightBaseboard = rightBaseboard;
    this.roomGroup.add(rightBaseboard);
  }

  public getRoomGroup(): THREE.Group {
    return this.roomGroup;
  }

  public updateMaterialColor(materialName: string, color: string): void {
    if (this.materials[materialName]) {
      (this.materials[materialName] as THREE.MeshStandardMaterial).color.set(
        color,
      );
    }
  }

  // Individual geometry editing methods for admin

  // Floor controls
  public updateFloorWidth(newWidth: number): void {
    this.floorWidth = Math.max(5, Math.min(50, newWidth));
    this.rebuildRoom();
  }

  public updateFloorDepth(newDepth: number): void {
    this.floorDepth = Math.max(5, Math.min(50, newDepth));
    this.rebuildRoom();
  }

  public updateFloorThickness(newThickness: number): void {
    this.floorThickness = Math.max(0.1, Math.min(1, newThickness));
    this.rebuildRoom();
  }

  // Ceiling controls
  public updateCeilingWidth(newWidth: number): void {
    this.ceilingWidth = Math.max(5, Math.min(50, newWidth));
    this.rebuildRoom();
  }

  public updateCeilingDepth(newDepth: number): void {
    this.ceilingDepth = Math.max(5, Math.min(50, newDepth));
    this.rebuildRoom();
  }

  public updateCeilingThickness(newThickness: number): void {
    this.ceilingThickness = Math.max(0.1, Math.min(1, newThickness));
    this.rebuildRoom();
  }

  // Back wall controls
  public updateBackWallWidth(newWidth: number): void {
    this.backWallWidth = Math.max(5, Math.min(50, newWidth));
    this.rebuildRoom();
  }

  public updateBackWallHeight(newHeight: number): void {
    this.backWallHeight = Math.max(3, Math.min(20, newHeight));
    this.rebuildRoom();
  }

  // Left wall controls
  public updateLeftWallDepth(newDepth: number): void {
    this.leftWallDepth = Math.max(5, Math.min(50, newDepth));
    this.rebuildRoom();
  }

  public updateLeftWallHeight(newHeight: number): void {
    this.leftWallHeight = Math.max(3, Math.min(20, newHeight));
    this.rebuildRoom();
  }

  // Right wall controls
  public updateRightWallDepth(newDepth: number): void {
    this.rightWallDepth = Math.max(5, Math.min(50, newDepth));
    this.rebuildRoom();
  }

  public updateRightWallHeight(newHeight: number): void {
    this.rightWallHeight = Math.max(3, Math.min(20, newHeight));
    this.rebuildRoom();
  }

  // Wall thickness control (affects all walls)
  public updateWallThickness(newThickness: number): void {
    this.wallThickness = Math.max(0.1, Math.min(1, newThickness));
    this.rebuildRoom();
  }

  // Legacy methods for backward compatibility
  public updateRoomSize(newSize: number): void {
    this.floorWidth =
      this.floorDepth =
      this.ceilingWidth =
      this.ceilingDepth =
      this.backWallWidth =
      this.leftWallDepth =
      this.rightWallDepth =
        Math.max(5, Math.min(50, newSize));
    this.rebuildRoom();
  }

  public updateRoomHeight(newHeight: number): void {
    this.backWallHeight =
      this.leftWallHeight =
      this.rightWallHeight =
        Math.max(3, Math.min(20, newHeight));
    this.rebuildRoom();
  }

  private rebuildRoom(): void {
    // Remove existing room elements
    Object.values(this.roomMeshes).forEach((mesh) => {
      if (mesh.geometry) mesh.geometry.dispose();
      this.roomGroup.remove(mesh);
    });
    this.roomMeshes = {};

    // Recreate room with new dimensions
    this.createRoom();
  }

  // Material property controls for admin
  public updateFloorMaterial(properties: {
    color?: string;
    roughness?: number;
    metalness?: number;
  }): void {
    const material = this.materials.floor as THREE.MeshStandardMaterial;
    if (properties.color) material.color.set(properties.color);
    if (properties.roughness !== undefined)
      material.roughness = Math.max(0, Math.min(1, properties.roughness));
    if (properties.metalness !== undefined)
      material.metalness = Math.max(0, Math.min(1, properties.metalness));
  }

  public updateWallMaterial(properties: {
    color?: string;
    roughness?: number;
    metalness?: number;
  }): void {
    const material = this.materials.wall as THREE.MeshStandardMaterial;
    if (properties.color) material.color.set(properties.color);
    if (properties.roughness !== undefined)
      material.roughness = Math.max(0, Math.min(1, properties.roughness));
    if (properties.metalness !== undefined)
      material.metalness = Math.max(0, Math.min(1, properties.metalness));
  }

  public updateCeilingMaterial(properties: {
    color?: string;
    roughness?: number;
    metalness?: number;
  }): void {
    const material = this.materials.ceiling as THREE.MeshStandardMaterial;
    if (properties.color) material.color.set(properties.color);
    if (properties.roughness !== undefined)
      material.roughness = Math.max(0, Math.min(1, properties.roughness));
    if (properties.metalness !== undefined)
      material.metalness = Math.max(0, Math.min(1, properties.metalness));
  }

  public updateBaseboardMaterial(properties: {
    color?: string;
    roughness?: number;
    metalness?: number;
  }): void {
    const material = this.materials.baseboard as THREE.MeshStandardMaterial;
    if (properties.color) material.color.set(properties.color);
    if (properties.roughness !== undefined)
      material.roughness = Math.max(0, Math.min(1, properties.roughness));
    if (properties.metalness !== undefined)
      material.metalness = Math.max(0, Math.min(1, properties.metalness));
  }

  public getMaterialProperties(): {
    floor: { color: string; roughness: number; metalness: number };
    wall: { color: string; roughness: number; metalness: number };
    ceiling: { color: string; roughness: number; metalness: number };
    baseboard: { color: string; roughness: number; metalness: number };
  } {
    const floorMat = this.materials.floor as THREE.MeshStandardMaterial;
    const wallMat = this.materials.wall as THREE.MeshStandardMaterial;
    const ceilingMat = this.materials.ceiling as THREE.MeshStandardMaterial;
    const baseboardMat = this.materials.baseboard as THREE.MeshStandardMaterial;

    return {
      floor: {
        color: `#${floorMat.color.getHexString()}`,
        roughness: floorMat.roughness,
        metalness: floorMat.metalness,
      },
      wall: {
        color: `#${wallMat.color.getHexString()}`,
        roughness: wallMat.roughness,
        metalness: wallMat.metalness,
      },
      ceiling: {
        color: `#${ceilingMat.color.getHexString()}`,
        roughness: ceilingMat.roughness,
        metalness: ceilingMat.metalness,
      },
      baseboard: {
        color: `#${baseboardMat.color.getHexString()}`,
        roughness: baseboardMat.roughness,
        metalness: baseboardMat.metalness,
      },
    };
  }

  public getRoomDimensions(): {
    size: number; // Legacy
    height: number; // Legacy
    wallThickness: number;
    floorThickness: number;
    ceilingThickness: number;
    // Individual dimensions
    floorWidth: number;
    floorDepth: number;
    ceilingWidth: number;
    ceilingDepth: number;
    backWallWidth: number;
    backWallHeight: number;
    leftWallDepth: number;
    leftWallHeight: number;
    rightWallDepth: number;
    rightWallHeight: number;
  } {
    return {
      // Legacy values (for backward compatibility)
      size: this.roomSize,
      height: this.roomHeight,
      wallThickness: this.wallThickness,
      floorThickness: this.floorThickness,
      ceilingThickness: this.ceilingThickness,
      // Individual dimensions
      floorWidth: this.floorWidth,
      floorDepth: this.floorDepth,
      ceilingWidth: this.ceilingWidth,
      ceilingDepth: this.ceilingDepth,
      backWallWidth: this.backWallWidth,
      backWallHeight: this.backWallHeight,
      leftWallDepth: this.leftWallDepth,
      leftWallHeight: this.leftWallHeight,
      rightWallDepth: this.rightWallDepth,
      rightWallHeight: this.rightWallHeight,
    };
  }

  // Reset methods for admin controls
  public resetGeometryToDefaults(): void {
    this.floorWidth = this.defaultDimensions.floorWidth;
    this.floorDepth = this.defaultDimensions.floorDepth;
    this.ceilingWidth = this.defaultDimensions.ceilingWidth;
    this.ceilingDepth = this.defaultDimensions.ceilingDepth;
    this.backWallWidth = this.defaultDimensions.backWallWidth;
    this.backWallHeight = this.defaultDimensions.backWallHeight;
    this.leftWallDepth = this.defaultDimensions.leftWallDepth;
    this.leftWallHeight = this.defaultDimensions.leftWallHeight;
    this.rightWallDepth = this.defaultDimensions.rightWallDepth;
    this.rightWallHeight = this.defaultDimensions.rightWallHeight;
    this.wallThickness = this.defaultDimensions.wallThickness;
    this.floorThickness = this.defaultDimensions.floorThickness;
    this.ceilingThickness = this.defaultDimensions.ceilingThickness;
    this.rebuildRoom();
  }

  public resetMaterialsToDefaults(): void {
    // Reset floor material
    const floorMat = this.materials.floor as THREE.MeshStandardMaterial;
    floorMat.color.set(this.defaultMaterials.floor.color);
    floorMat.roughness = this.defaultMaterials.floor.roughness;
    floorMat.metalness = this.defaultMaterials.floor.metalness;

    // Reset wall material
    const wallMat = this.materials.wall as THREE.MeshStandardMaterial;
    wallMat.color.set(this.defaultMaterials.wall.color);
    wallMat.roughness = this.defaultMaterials.wall.roughness;
    wallMat.metalness = this.defaultMaterials.wall.metalness;

    // Reset ceiling material
    const ceilingMat = this.materials.ceiling as THREE.MeshStandardMaterial;
    ceilingMat.color.set(this.defaultMaterials.ceiling.color);
    ceilingMat.roughness = this.defaultMaterials.ceiling.roughness;
    ceilingMat.metalness = this.defaultMaterials.ceiling.metalness;

    // Reset baseboard material
    const baseboardMat = this.materials.baseboard as THREE.MeshStandardMaterial;
    baseboardMat.color.set(this.defaultMaterials.baseboard.color);
    baseboardMat.roughness = this.defaultMaterials.baseboard.roughness;
    baseboardMat.metalness = this.defaultMaterials.baseboard.metalness;
  }
}
