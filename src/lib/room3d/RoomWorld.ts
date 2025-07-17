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
      this.roomSize,
      this.floorThickness,
      this.roomSize,
    );
    const floor = new THREE.Mesh(floorGeometry, this.materials.floor);

    floor.position.y = -this.floorThickness / 2;
    floor.receiveShadow = true;
    floor.castShadow = true;

    this.roomMeshes.floor = floor;
    this.roomGroup.add(floor);
  }

  private createWalls(): void {
    const halfSize = this.roomSize / 2;

    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(
      this.roomSize,
      this.roomHeight,
      this.wallThickness,
    );
    const backWall = new THREE.Mesh(backWallGeometry, this.materials.wall);
    backWall.position.set(0, this.roomHeight / 2, -halfSize);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.roomMeshes.backWall = backWall;
    this.roomGroup.add(backWall);

    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(
      this.wallThickness,
      this.roomHeight,
      this.roomSize,
    );
    const leftWall = new THREE.Mesh(leftWallGeometry, this.materials.wall);
    leftWall.position.set(-halfSize, this.roomHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.roomMeshes.leftWall = leftWall;
    this.roomGroup.add(leftWall);

    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(
      this.wallThickness,
      this.roomHeight,
      this.roomSize,
    );
    const rightWall = new THREE.Mesh(rightWallGeometry, this.materials.wall);
    rightWall.position.set(halfSize, this.roomHeight / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.roomMeshes.rightWall = rightWall;
    this.roomGroup.add(rightWall);
  }

  private createCeiling(): void {
    const ceilingGeometry = new THREE.BoxGeometry(
      this.roomSize,
      this.ceilingThickness,
      this.roomSize,
    );
    const ceiling = new THREE.Mesh(ceilingGeometry, this.materials.ceiling);

    ceiling.position.y = this.roomHeight + this.ceilingThickness / 2;
    ceiling.receiveShadow = true;
    ceiling.castShadow = true;

    this.roomMeshes.ceiling = ceiling;
    this.roomGroup.add(ceiling);
  }

  private createBaseboards(): void {
    const baseboardHeight = 0.3;
    const baseboardDepth = 0.1;
    const halfSize = this.roomSize / 2;

    // Back baseboard
    const backBaseboardGeometry = new THREE.BoxGeometry(
      this.roomSize,
      baseboardHeight,
      baseboardDepth,
    );
    const backBaseboard = new THREE.Mesh(
      backBaseboardGeometry,
      this.materials.baseboard,
    );
    backBaseboard.position.set(
      0,
      baseboardHeight / 2,
      -halfSize + baseboardDepth / 2,
    );
    backBaseboard.castShadow = true;
    this.roomMeshes.backBaseboard = backBaseboard;
    this.roomGroup.add(backBaseboard);

    // Left baseboard
    const leftBaseboardGeometry = new THREE.BoxGeometry(
      baseboardDepth,
      baseboardHeight,
      this.roomSize,
    );
    const leftBaseboard = new THREE.Mesh(
      leftBaseboardGeometry,
      this.materials.baseboard,
    );
    leftBaseboard.position.set(
      -halfSize + baseboardDepth / 2,
      baseboardHeight / 2,
      0,
    );
    leftBaseboard.castShadow = true;
    this.roomMeshes.leftBaseboard = leftBaseboard;
    this.roomGroup.add(leftBaseboard);

    // Right baseboard
    const rightBaseboardGeometry = new THREE.BoxGeometry(
      baseboardDepth,
      baseboardHeight,
      this.roomSize,
    );
    const rightBaseboard = new THREE.Mesh(
      rightBaseboardGeometry,
      this.materials.baseboard,
    );
    rightBaseboard.position.set(
      halfSize - baseboardDepth / 2,
      baseboardHeight / 2,
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

  // Geometry editing methods for admin
  public updateRoomSize(newSize: number): void {
    this.roomSize = Math.max(5, Math.min(50, newSize)); // Limit between 5 and 50
    this.rebuildRoom();
  }

  public updateRoomHeight(newHeight: number): void {
    this.roomHeight = Math.max(3, Math.min(20, newHeight)); // Limit between 3 and 20
    this.rebuildRoom();
  }

  public updateWallThickness(newThickness: number): void {
    this.wallThickness = Math.max(0.1, Math.min(1, newThickness)); // Limit between 0.1 and 1
    this.rebuildRoom();
  }

  public updateFloorThickness(newThickness: number): void {
    this.floorThickness = Math.max(0.1, Math.min(1, newThickness)); // Limit between 0.1 and 1
    this.rebuildRoom();
  }

  public updateCeilingThickness(newThickness: number): void {
    this.ceilingThickness = Math.max(0.1, Math.min(1, newThickness)); // Limit between 0.1 and 1
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

  public getRoomDimensions(): {
    size: number;
    height: number;
    wallThickness: number;
    floorThickness: number;
    ceilingThickness: number;
  } {
    return {
      size: this.roomSize,
      height: this.roomHeight,
      wallThickness: this.wallThickness,
      floorThickness: this.floorThickness,
      ceilingThickness: this.ceilingThickness,
    };
  }
}
