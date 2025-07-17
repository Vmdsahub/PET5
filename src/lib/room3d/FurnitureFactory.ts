import * as THREE from "three";

export class FurnitureFactory {
  private materials: { [key: string]: THREE.Material };

  constructor() {
    this.createMaterials();
  }

  private createMaterials(): void {
    this.materials = {
      wood: new THREE.MeshStandardMaterial({
        color: "#8B4513",
        roughness: 0.7,
        metalness: 0.1,
      }),

      darkWood: new THREE.MeshStandardMaterial({
        color: "#5D4E37",
        roughness: 0.8,
        metalness: 0.1,
      }),

      metal: new THREE.MeshStandardMaterial({
        color: "#C0C0C0",
        roughness: 0.3,
        metalness: 0.8,
      }),

      fabric: new THREE.MeshStandardMaterial({
        color: "#4A5D23",
        roughness: 0.9,
        metalness: 0.0,
      }),

      leather: new THREE.MeshStandardMaterial({
        color: "#8B4513",
        roughness: 0.6,
        metalness: 0.0,
      }),

      cushion: new THREE.MeshStandardMaterial({
        color: "#CD853F",
        roughness: 0.8,
        metalness: 0.0,
      }),

      lampShade: new THREE.MeshStandardMaterial({
        color: "#F5F5DC",
        roughness: 0.8,
        metalness: 0.0,
      }),

      glass: new THREE.MeshStandardMaterial({
        color: "#FFFFFF",
        roughness: 0.1,
        metalness: 0.0,
        transparent: true,
        opacity: 0.3,
      }),

      plant: new THREE.MeshStandardMaterial({
        color: "#228B22",
        roughness: 0.9,
        metalness: 0.0,
      }),

      screen: new THREE.MeshStandardMaterial({
        color: "#000000",
        roughness: 0.1,
        metalness: 0.0,
      }),
    };
  }

  public getAvailableTypes(): string[] {
    return [
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
    ];
  }

  public create(type: string): THREE.Object3D | null {
    switch (type) {
      case "sofa":
        return this.createSofa();
      case "table":
        return this.createCoffeeTable();
      case "diningTable":
        return this.createDiningTable();
      case "chair":
        return this.createChair();
      case "bookshelf":
        return this.createBookshelf();
      case "lamp":
        return this.createFloorLamp();
      case "tableLamp":
        return this.createTableLamp();
      case "plant":
        return this.createPlant();
      case "tvStand":
        return this.createTVStand();
      case "sideTable":
        return this.createSideTable();
      case "wallShelf":
        return this.createWallShelf();
      case "pictureFrame":
        return this.createPictureFrame();
      case "wallClock":
        return this.createWallClock();
      case "pendantLight":
        return this.createPendantLight();
      default:
        console.warn(`Unknown furniture type: ${type}`);
        return null;
    }
  }

  private createSofa(): THREE.Group {
    const sofa = new THREE.Group();

    // Main body
    const bodyGeometry = new THREE.BoxGeometry(3, 0.8, 1.5);
    const body = new THREE.Mesh(bodyGeometry, this.materials.fabric);
    body.position.y = 0.4;
    body.castShadow = true;
    body.receiveShadow = true;
    sofa.add(body);

    // Backrest
    const backGeometry = new THREE.BoxGeometry(3, 1.5, 0.3);
    const back = new THREE.Mesh(backGeometry, this.materials.fabric);
    back.position.set(0, 1.35, -0.6);
    back.castShadow = true;
    sofa.add(back);

    // Arms
    const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 1.5);
    [-1.35, 1.35].forEach((x) => {
      const arm = new THREE.Mesh(armGeometry, this.materials.fabric);
      arm.position.set(x, 1.2, 0);
      arm.castShadow = true;
      sofa.add(arm);
    });

    // Cushions
    const cushionGeometry = new THREE.BoxGeometry(0.8, 0.3, 1.2);
    for (let i = 0; i < 3; i++) {
      const cushion = new THREE.Mesh(cushionGeometry, this.materials.cushion);
      cushion.position.set(-1 + i * 1, 0.95, 0);
      cushion.castShadow = true;
      sofa.add(cushion);
    }

    return sofa;
  }

  private createCoffeeTable(): THREE.Group {
    const table = new THREE.Group();

    // Table top
    const topGeometry = new THREE.BoxGeometry(2, 0.1, 1);
    const top = new THREE.Mesh(topGeometry, this.materials.wood);
    top.position.y = 0.5;
    top.castShadow = true;
    top.receiveShadow = true;
    table.add(top);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.08, 0.5, 0.08);
    const legPositions = [
      [-0.9, 0.25, -0.4],
      [0.9, 0.25, -0.4],
      [-0.9, 0.25, 0.4],
      [0.9, 0.25, 0.4],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeometry, this.materials.wood);
      leg.position.set(...pos);
      leg.castShadow = true;
      table.add(leg);
    });

    return table;
  }

  private createDiningTable(): THREE.Group {
    const table = new THREE.Group();

    // Table top
    const topGeometry = new THREE.BoxGeometry(4, 0.15, 2);
    const top = new THREE.Mesh(topGeometry, this.materials.darkWood);
    top.position.y = 1.5;
    top.castShadow = true;
    top.receiveShadow = true;
    table.add(top);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.12, 1.5, 0.12);
    const legPositions = [
      [-1.8, 0.75, -0.8],
      [1.8, 0.75, -0.8],
      [-1.8, 0.75, 0.8],
      [1.8, 0.75, 0.8],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeometry, this.materials.darkWood);
      leg.position.set(...pos);
      leg.castShadow = true;
      table.add(leg);
    });

    return table;
  }

  private createChair(): THREE.Group {
    const chair = new THREE.Group();

    // Seat
    const seatGeometry = new THREE.BoxGeometry(1, 0.1, 1);
    const seat = new THREE.Mesh(seatGeometry, this.materials.wood);
    seat.position.y = 1;
    seat.castShadow = true;
    seat.receiveShadow = true;
    chair.add(seat);

    // Backrest
    const backGeometry = new THREE.BoxGeometry(1, 1.5, 0.1);
    const back = new THREE.Mesh(backGeometry, this.materials.wood);
    back.position.set(0, 1.75, -0.45);
    back.castShadow = true;
    chair.add(back);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.08, 1, 0.08);
    const legPositions = [
      [-0.4, 0.5, -0.4],
      [0.4, 0.5, -0.4],
      [-0.4, 0.5, 0.4],
      [0.4, 0.5, 0.4],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeometry, this.materials.wood);
      leg.position.set(...pos);
      leg.castShadow = true;
      chair.add(leg);
    });

    return chair;
  }

  private createBookshelf(): THREE.Group {
    const bookshelf = new THREE.Group();

    // Main frame
    const frameGeometry = new THREE.BoxGeometry(2, 4, 0.3);
    const frame = new THREE.Mesh(frameGeometry, this.materials.darkWood);
    frame.position.y = 2;
    frame.castShadow = true;
    frame.receiveShadow = true;
    bookshelf.add(frame);

    // Shelves
    const shelfGeometry = new THREE.BoxGeometry(1.8, 0.05, 0.25);
    for (let i = 0; i < 4; i++) {
      const shelf = new THREE.Mesh(shelfGeometry, this.materials.darkWood);
      shelf.position.set(0, 0.5 + i * 0.8, 0);
      shelf.castShadow = true;
      bookshelf.add(shelf);
    }

    // Books
    const bookColors = ["#8B0000", "#006400", "#4B0082", "#FF8C00", "#2F4F4F"];
    for (let shelf = 0; shelf < 4; shelf++) {
      for (let book = 0; book < 8; book++) {
        const bookGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.02);
        const bookMaterial = new THREE.MeshStandardMaterial({
          color: bookColors[book % bookColors.length],
          roughness: 0.8,
        });
        const bookMesh = new THREE.Mesh(bookGeometry, bookMaterial);
        bookMesh.position.set(-0.7 + book * 0.18, 0.8 + shelf * 0.8, 0.1);
        bookMesh.castShadow = true;
        bookshelf.add(bookMesh);
      }
    }

    return bookshelf;
  }

  private createFloorLamp(): THREE.Group {
    const lamp = new THREE.Group();

    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1);
    const base = new THREE.Mesh(baseGeometry, this.materials.metal);
    base.position.y = 0.05;
    base.castShadow = true;
    lamp.add(base);

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3);
    const pole = new THREE.Mesh(poleGeometry, this.materials.metal);
    pole.position.y = 1.5;
    pole.castShadow = true;
    lamp.add(pole);

    // Shade
    const shadeGeometry = new THREE.ConeGeometry(0.8, 1, 16, 1, true);
    const shade = new THREE.Mesh(shadeGeometry, this.materials.lampShade);
    shade.position.y = 3.5;
    shade.castShadow = true;
    lamp.add(shade);

    return lamp;
  }

  private createTableLamp(): THREE.Group {
    const lamp = new THREE.Group();

    // Base
    const baseGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05);
    const base = new THREE.Mesh(baseGeometry, this.materials.metal);
    base.position.y = 0.025;
    base.castShadow = true;
    lamp.add(base);

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.8);
    const pole = new THREE.Mesh(poleGeometry, this.materials.metal);
    pole.position.y = 0.4;
    pole.castShadow = true;
    lamp.add(pole);

    // Shade
    const shadeGeometry = new THREE.ConeGeometry(0.3, 0.4, 16, 1, true);
    const shade = new THREE.Mesh(shadeGeometry, this.materials.lampShade);
    shade.position.y = 1;
    shade.castShadow = true;
    lamp.add(shade);

    return lamp;
  }

  private createPlant(): THREE.Group {
    const plant = new THREE.Group();

    // Pot
    const potGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.4);
    const pot = new THREE.Mesh(potGeometry, this.materials.darkWood);
    pot.position.y = 0.2;
    pot.castShadow = true;
    plant.add(pot);

    // Plant stems and leaves
    for (let i = 0; i < 8; i++) {
      const stemGeometry = new THREE.CylinderGeometry(
        0.02,
        0.02,
        1 + Math.random() * 0.5,
      );
      const stem = new THREE.Mesh(stemGeometry, this.materials.plant);
      stem.position.set(
        (Math.random() - 0.5) * 0.3,
        0.4 + stemGeometry.parameters.height / 2,
        (Math.random() - 0.5) * 0.3,
      );
      stem.castShadow = true;
      plant.add(stem);

      // Leaves
      const leafGeometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.1);
      const leaf = new THREE.Mesh(leafGeometry, this.materials.plant);
      leaf.position.set(
        stem.position.x + (Math.random() - 0.5) * 0.2,
        stem.position.y + stemGeometry.parameters.height / 2,
        stem.position.z + (Math.random() - 0.5) * 0.2,
      );
      leaf.castShadow = true;
      plant.add(leaf);
    }

    return plant;
  }

  private createTVStand(): THREE.Group {
    const tvStand = new THREE.Group();

    // Main cabinet
    const cabinetGeometry = new THREE.BoxGeometry(4, 0.8, 1);
    const cabinet = new THREE.Mesh(cabinetGeometry, this.materials.darkWood);
    cabinet.position.y = 0.4;
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    tvStand.add(cabinet);

    // TV Screen
    const screenGeometry = new THREE.BoxGeometry(3, 1.8, 0.1);
    const screen = new THREE.Mesh(screenGeometry, this.materials.screen);
    screen.position.set(0, 1.7, 0);
    screen.castShadow = true;
    tvStand.add(screen);

    return tvStand;
  }

  private createSideTable(): THREE.Group {
    const table = new THREE.Group();

    // Top
    const topGeometry = new THREE.BoxGeometry(1, 0.08, 1);
    const top = new THREE.Mesh(topGeometry, this.materials.wood);
    top.position.y = 1.2;
    top.castShadow = true;
    top.receiveShadow = true;
    table.add(top);

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.06, 1.2, 0.06);
    const legPositions = [
      [-0.4, 0.6, -0.4],
      [0.4, 0.6, -0.4],
      [-0.4, 0.6, 0.4],
      [0.4, 0.6, 0.4],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeometry, this.materials.wood);
      leg.position.set(...pos);
      leg.castShadow = true;
      table.add(leg);
    });

    return table;
  }

  private createWallShelf(): THREE.Group {
    const shelf = new THREE.Group();

    // Shelf
    const shelfGeometry = new THREE.BoxGeometry(2, 0.1, 0.3);
    const shelfMesh = new THREE.Mesh(shelfGeometry, this.materials.wood);
    shelfMesh.castShadow = true;
    shelfMesh.receiveShadow = true;
    shelf.add(shelfMesh);

    // Decorative items
    for (let i = 0; i < 3; i++) {
      const itemGeometry = new THREE.SphereGeometry(0.08);
      const item = new THREE.Mesh(itemGeometry, this.materials.glass);
      item.position.set(-0.6 + i * 0.6, 0.15, 0);
      item.castShadow = true;
      shelf.add(item);
    }

    return shelf;
  }

  private createPictureFrame(): THREE.Group {
    const frame = new THREE.Group();

    // Frame border
    const frameGeometry = new THREE.BoxGeometry(1.5, 1, 0.05);
    const frameMesh = new THREE.Mesh(frameGeometry, this.materials.darkWood);
    frameMesh.castShadow = true;
    frame.add(frameMesh);

    // Picture/Glass
    const pictureGeometry = new THREE.BoxGeometry(1.3, 0.8, 0.02);
    const picture = new THREE.Mesh(pictureGeometry, this.materials.glass);
    picture.position.z = 0.02;
    frame.add(picture);

    return frame;
  }

  private createWallClock(): THREE.Group {
    const clock = new THREE.Group();

    // Clock face
    const faceGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1);
    const face = new THREE.Mesh(faceGeometry, this.materials.wood);
    face.rotation.x = Math.PI / 2;
    face.castShadow = true;
    clock.add(face);

    // Clock hands
    const hourHandGeometry = new THREE.BoxGeometry(0.02, 0.3, 0.01);
    const hourHand = new THREE.Mesh(hourHandGeometry, this.materials.metal);
    hourHand.position.z = 0.06;
    clock.add(hourHand);

    const minuteHandGeometry = new THREE.BoxGeometry(0.015, 0.4, 0.01);
    const minuteHand = new THREE.Mesh(minuteHandGeometry, this.materials.metal);
    minuteHand.position.z = 0.07;
    clock.add(minuteHand);

    return clock;
  }

  private createPendantLight(): THREE.Group {
    const light = new THREE.Group();

    // Cord
    const cordGeometry = new THREE.CylinderGeometry(0.01, 0.01, 2);
    const cord = new THREE.Mesh(cordGeometry, this.materials.metal);
    cord.position.y = -1;
    light.add(cord);

    // Shade
    const shadeGeometry = new THREE.ConeGeometry(0.4, 0.6, 16, 1, true);
    const shade = new THREE.Mesh(shadeGeometry, this.materials.lampShade);
    shade.position.y = -2.3;
    shade.castShadow = true;
    light.add(shade);

    return light;
  }
}
