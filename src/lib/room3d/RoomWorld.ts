import * as THREE from "three";

export class RoomWorld {
  private scene: THREE.Scene;
  private roomGroup: THREE.Group;
  private materials: { [key: string]: THREE.Material };

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
    const roomSize = 20;
    const roomHeight = 10;
    const wallThickness = 0.2;

    // Floor
    this.createFloor(roomSize);

    // Walls
    this.createWalls(roomSize, roomHeight, wallThickness);

    // Ceiling
    this.createCeiling(roomSize, roomHeight);

    // Baseboards
    this.createBaseboards(roomSize, wallThickness);
  }

  private createFloor(size: number): void {
    const floorThickness = 0.2;
    const floorGeometry = new THREE.BoxGeometry(size, floorThickness, size);
    const floor = new THREE.Mesh(floorGeometry, this.materials.floor);

    floor.position.y = -floorThickness / 2;
    floor.receiveShadow = true;
    floor.castShadow = true;

    this.roomGroup.add(floor);
  }

  private createWalls(size: number, height: number, thickness: number): void {
    const halfSize = size / 2;

    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(size, height, thickness);
    const backWall = new THREE.Mesh(backWallGeometry, this.materials.wall);
    backWall.position.set(0, height / 2, -halfSize);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.roomGroup.add(backWall);

    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(thickness, height, size);
    const leftWall = new THREE.Mesh(leftWallGeometry, this.materials.wall);
    leftWall.position.set(-halfSize, height / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.roomGroup.add(leftWall);

    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(thickness, height, size);
    const rightWall = new THREE.Mesh(rightWallGeometry, this.materials.wall);
    rightWall.position.set(halfSize, height / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.roomGroup.add(rightWall);
  }

  private createCeiling(size: number, height: number): void {
    const ceilingThickness = 0.2;
    const ceilingGeometry = new THREE.BoxGeometry(size, ceilingThickness, size);
    const ceiling = new THREE.Mesh(ceilingGeometry, this.materials.ceiling);

    ceiling.position.y = height + ceilingThickness / 2;
    ceiling.receiveShadow = true;
    ceiling.castShadow = true;

    this.roomGroup.add(ceiling);
  }

  private createBaseboards(size: number, thickness: number): void {
    const baseboardHeight = 0.3;
    const baseboardDepth = 0.1;
    const halfSize = size / 2;

    // Back baseboard
    const backBaseboardGeometry = new THREE.BoxGeometry(
      size,
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
    this.roomGroup.add(backBaseboard);

    // Left baseboard
    const leftBaseboardGeometry = new THREE.BoxGeometry(
      baseboardDepth,
      baseboardHeight,
      size,
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
    this.roomGroup.add(leftBaseboard);

    // Right baseboard
    const rightBaseboardGeometry = new THREE.BoxGeometry(
      baseboardDepth,
      baseboardHeight,
      size,
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
}
