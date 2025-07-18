import * as THREE from "three";
import Experience from "./Experience.js";

export default class SimpleRoom {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.debug = this.experience.debug;

    // Debug
    if (this.debug) {
      this.debugFolder = this.debug.addFolder({
        title: "simpleRoom",
        expanded: true,
      });
    }

    this.setRoom();
  }

  setRoom() {
    this.room = {};
    this.room.group = new THREE.Group();
    this.scene.add(this.room.group);

    // Materials
    this.room.materials = {};

    // Floor material
    this.room.materials.floor = new THREE.MeshStandardMaterial({
      color: "#8B7355",
      roughness: 0.8,
      metalness: 0.1,
    });

    // Wall material
    this.room.materials.wall = new THREE.MeshStandardMaterial({
      color: "#E8E8E8",
      roughness: 0.9,
      metalness: 0.05,
    });

    // Ceiling material (separate from walls)
    this.room.materials.ceiling = new THREE.MeshStandardMaterial({
      color: "#F5F5F5",
      roughness: 0.85,
      metalness: 0.02,
    });

    // Initialize geometry parameters
    this.geometryParams = {
      roomWidth: 20,
      roomDepth: 20,
      roomHeight: 10,
      wallThickness: 0.1,
    };

    // Floor
    this.room.floor = {};
    this.room.floor.geometry = new THREE.PlaneGeometry(
      this.geometryParams.roomWidth,
      this.geometryParams.roomDepth,
    );
    this.room.floor.mesh = new THREE.Mesh(
      this.room.floor.geometry,
      this.room.materials.floor,
    );
    this.room.floor.mesh.rotation.x = -Math.PI * 0.5;
    this.room.floor.mesh.position.y = 0;
    this.room.group.add(this.room.floor.mesh);

    // Back wall
    this.room.backWall = {};
    this.room.backWall.geometry = new THREE.PlaneGeometry(
      this.geometryParams.roomWidth,
      this.geometryParams.roomHeight,
    );
    this.room.backWall.mesh = new THREE.Mesh(
      this.room.backWall.geometry,
      this.room.materials.wall,
    );
    this.room.backWall.mesh.position.z = -this.geometryParams.roomDepth / 2;
    this.room.backWall.mesh.position.y = this.geometryParams.roomHeight / 2;
    this.room.group.add(this.room.backWall.mesh);

    // Left wall
    this.room.leftWall = {};
    this.room.leftWall.geometry = new THREE.PlaneGeometry(
      this.geometryParams.roomDepth,
      this.geometryParams.roomHeight,
    );
    this.room.leftWall.mesh = new THREE.Mesh(
      this.room.leftWall.geometry,
      this.room.materials.wall,
    );
    this.room.leftWall.mesh.rotation.y = Math.PI * 0.5;
    this.room.leftWall.mesh.position.x = -this.geometryParams.roomWidth / 2;
    this.room.leftWall.mesh.position.y = this.geometryParams.roomHeight / 2;
    this.room.group.add(this.room.leftWall.mesh);

    // Right wall
    this.room.rightWall = {};
    this.room.rightWall.geometry = new THREE.PlaneGeometry(
      this.geometryParams.roomDepth,
      this.geometryParams.roomHeight,
    );
    this.room.rightWall.mesh = new THREE.Mesh(
      this.room.rightWall.geometry,
      this.room.materials.wall,
    );
    this.room.rightWall.mesh.rotation.y = -Math.PI * 0.5;
    this.room.rightWall.mesh.position.x = this.geometryParams.roomWidth / 2;
    this.room.rightWall.mesh.position.y = this.geometryParams.roomHeight / 2;
    this.room.group.add(this.room.rightWall.mesh);

    // Ceiling
    this.room.ceiling = {};
    this.room.ceiling.geometry = new THREE.PlaneGeometry(
      this.geometryParams.roomWidth,
      this.geometryParams.roomDepth,
    );
    this.room.ceiling.mesh = new THREE.Mesh(
      this.room.ceiling.geometry,
      this.room.materials.ceiling,
    );
    this.room.ceiling.mesh.rotation.x = Math.PI * 0.5;
    this.room.ceiling.mesh.position.y = this.geometryParams.roomHeight;
    this.room.group.add(this.room.ceiling.mesh);

    // Debug
    if (this.debug) {
      const geometryFolder = this.debugFolder.addFolder({
        title: "Geometry",
        expanded: true,
      });

      geometryFolder
        .addInput(this.geometryParams, "roomWidth", {
          min: 10,
          max: 40,
          step: 1,
        })
        .on("change", () => this.updateRoomGeometry());

      geometryFolder
        .addInput(this.geometryParams, "roomDepth", {
          min: 10,
          max: 40,
          step: 1,
        })
        .on("change", () => this.updateRoomGeometry());

      geometryFolder
        .addInput(this.geometryParams, "roomHeight", {
          min: 5,
          max: 20,
          step: 1,
        })
        .on("change", () => this.updateRoomGeometry());

      // Material controls
      const materialFolder = this.debugFolder.addFolder({
        title: "Materials",
        expanded: true,
      });

      materialFolder.addInput(this.room.materials.floor, "color", {
        view: "color",
        label: "Floor Color",
      });

      materialFolder.addInput(this.room.materials.wall, "color", {
        view: "color",
        label: "Wall Color",
      });

      materialFolder.addInput(this.room.materials.floor, "roughness", {
        label: "Floor Roughness",
        min: 0,
        max: 1,
      });

      materialFolder.addInput(this.room.materials.floor, "metalness", {
        label: "Floor Metalness",
        min: 0,
        max: 1,
      });

      materialFolder.addInput(this.room.materials.wall, "roughness", {
        label: "Wall Roughness",
        min: 0,
        max: 1,
      });

      materialFolder.addInput(this.room.materials.wall, "metalness", {
        label: "Wall Metalness",
        min: 0,
        max: 1,
      });

      // Ceiling material controls
      materialFolder.addInput(this.room.materials.ceiling, "color", {
        view: "color",
        label: "Ceiling Color",
      });

      materialFolder.addInput(this.room.materials.ceiling, "roughness", {
        label: "Ceiling Roughness",
        min: 0,
        max: 1,
      });

      materialFolder.addInput(this.room.materials.ceiling, "metalness", {
        label: "Ceiling Metalness",
        min: 0,
        max: 1,
      });
    }
  }

  updateRoomGeometry() {
    const { roomWidth, roomDepth, roomHeight } = this.geometryParams;

    // Update floor
    this.room.floor.geometry.dispose();
    this.room.floor.geometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    this.room.floor.mesh.geometry = this.room.floor.geometry;

    // Update back wall
    this.room.backWall.geometry.dispose();
    this.room.backWall.geometry = new THREE.PlaneGeometry(
      roomWidth,
      roomHeight,
    );
    this.room.backWall.mesh.geometry = this.room.backWall.geometry;
    this.room.backWall.mesh.position.z = -roomDepth / 2;
    this.room.backWall.mesh.position.y = roomHeight / 2;

    // Update left wall
    this.room.leftWall.geometry.dispose();
    this.room.leftWall.geometry = new THREE.PlaneGeometry(
      roomDepth,
      roomHeight,
    );
    this.room.leftWall.mesh.geometry = this.room.leftWall.geometry;
    this.room.leftWall.mesh.position.x = -roomWidth / 2;
    this.room.leftWall.mesh.position.y = roomHeight / 2;

    // Update right wall
    this.room.rightWall.geometry.dispose();
    this.room.rightWall.geometry = new THREE.PlaneGeometry(
      roomDepth,
      roomHeight,
    );
    this.room.rightWall.mesh.geometry = this.room.rightWall.geometry;
    this.room.rightWall.mesh.position.x = roomWidth / 2;
    this.room.rightWall.mesh.position.y = roomHeight / 2;

    // Update ceiling
    this.room.ceiling.geometry.dispose();
    this.room.ceiling.geometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    this.room.ceiling.mesh.geometry = this.room.ceiling.geometry;
    this.room.ceiling.mesh.position.y = roomHeight;
  }

  // Admin methods for material control
  updateFloorMaterial(properties) {
    Object.assign(this.room.materials.floor, properties);
  }

  updateWallMaterial(properties) {
    Object.assign(this.room.materials.wall, properties);
  }

  updateCeilingMaterial(properties) {
    Object.assign(this.room.materials.ceiling, properties);
  }

  getMaterialProperties() {
    return {
      floor: {
        color: this.room.materials.floor.color.getHexString(),
        roughness: this.room.materials.floor.roughness,
        metalness: this.room.materials.floor.metalness,
      },
      wall: {
        color: this.room.materials.wall.color.getHexString(),
        roughness: this.room.materials.wall.roughness,
        metalness: this.room.materials.wall.metalness,
      },
      ceiling: {
        color: this.room.materials.ceiling.color.getHexString(),
        roughness: this.room.materials.ceiling.roughness,
        metalness: this.room.materials.ceiling.metalness,
      },
    };
  }
}
