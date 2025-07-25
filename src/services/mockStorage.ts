// Mock storage service para simular persistência
export interface FurnitureItem {
  id: string;
  name: string;
  model: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  category: string;
  price: number;
  description: string;
}

export interface UserRoom {
  userId: string;
  placedFurniture: FurnitureItem[];
  inventory: FurnitureItem[];
}

// Mock data para catálogo de móveis
const FURNITURE_CATALOG: Omit<FurnitureItem, 'id' | 'position' | 'rotation' | 'scale'>[] = [
  {
    name: 'Sofá Moderno',
    model: '/models/sofa.glb',
    category: 'sala',
    price: 500,
    description: 'Sofá confortável para sua sala'
  },
  {
    name: 'Mesa de Centro',
    model: '/models/coffee-table.glb',
    category: 'sala',
    price: 200,
    description: 'Mesa de centro elegante'
  },
  {
    name: 'Poltrona',
    model: '/models/armchair.glb',
    category: 'sala',
    price: 300,
    description: 'Poltrona confortável'
  },
  {
    name: 'Estante',
    model: '/models/bookshelf.glb',
    category: 'sala',
    price: 400,
    description: 'Estante para livros e decorações'
  },
  {
    name: 'Cama',
    model: '/models/bed.glb',
    category: 'quarto',
    price: 800,
    description: 'Cama confortável'
  },
  {
    name: 'Guarda-roupa',
    model: '/models/wardrobe.glb',
    category: 'quarto',
    price: 600,
    description: 'Guarda-roupa espaçoso'
  },
  {
    name: 'Mesa de Jantar',
    model: '/models/dining-table.glb',
    category: 'cozinha',
    price: 700,
    description: 'Mesa para refeições'
  },
  {
    name: 'Cadeira',
    model: '/models/chair.glb',
    category: 'geral',
    price: 150,
    description: 'Cadeira confortável'
  },
  {
    name: 'Planta',
    model: '/models/plant.glb',
    category: 'decoração',
    price: 100,
    description: 'Planta decorativa'
  },
  {
    name: 'Luminária',
    model: '/models/lamp.glb',
    category: 'iluminação',
    price: 250,
    description: 'Luminária moderna'
  }
];

class MockStorageService {
  private userRooms: Map<string, UserRoom> = new Map();
  private nextId = 1;
  private customCatalog: Omit<FurnitureItem, 'id' | 'position' | 'rotation' | 'scale'>[] = [];

  constructor() {
    // Carregar dados do localStorage se existirem
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    const stored = localStorage.getItem('xenopets_room_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.userRooms = new Map(data.userRooms || []);
        this.nextId = data.nextId || 1;
      } catch (error) {
        console.warn('Erro ao carregar dados do localStorage:', error);
      }
    }
  }

  private saveToLocalStorage() {
    const data = {
      userRooms: Array.from(this.userRooms.entries()),
      nextId: this.nextId
    };
    localStorage.setItem('xenopets_room_data', JSON.stringify(data));
  }

  private generateId(): string {
    return `furniture_${this.nextId++}`;
  }

  getUserRoom(userId: string): UserRoom {
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, {
        userId,
        placedFurniture: [],
        inventory: []
      });
      this.saveToLocalStorage();
    }
    return this.userRooms.get(userId)!;
  }

  getFurnitureCatalog(): Omit<FurnitureItem, 'id' | 'position' | 'rotation' | 'scale'>[] {
    return [...FURNITURE_CATALOG];
  }

  buyFurniture(userId: string, catalogItem: Omit<FurnitureItem, 'id' | 'position' | 'rotation' | 'scale'>): FurnitureItem {
    const userRoom = this.getUserRoom(userId);
    const newItem: FurnitureItem = {
      ...catalogItem,
      id: this.generateId(),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    };
    
    userRoom.inventory.push(newItem);
    this.saveToLocalStorage();
    return newItem;
  }

  placeFurniture(userId: string, furnitureId: string, position: [number, number, number]): boolean {
    const userRoom = this.getUserRoom(userId);
    const inventoryIndex = userRoom.inventory.findIndex(item => item.id === furnitureId);
    
    if (inventoryIndex === -1) return false;

    const furniture = userRoom.inventory.splice(inventoryIndex, 1)[0];
    furniture.position = position;
    userRoom.placedFurniture.push(furniture);
    this.saveToLocalStorage();
    return true;
  }

  updateFurniturePosition(userId: string, furnitureId: string, position: [number, number, number], rotation?: [number, number, number]): boolean {
    const userRoom = this.getUserRoom(userId);
    const furniture = userRoom.placedFurniture.find(item => item.id === furnitureId);
    
    if (!furniture) return false;

    furniture.position = position;
    if (rotation) furniture.rotation = rotation;
    this.saveToLocalStorage();
    return true;
  }

  removeFurniture(userId: string, furnitureId: string): boolean {
    const userRoom = this.getUserRoom(userId);
    const placedIndex = userRoom.placedFurniture.findIndex(item => item.id === furnitureId);
    
    if (placedIndex === -1) return false;

    const furniture = userRoom.placedFurniture.splice(placedIndex, 1)[0];
    // Reset position and add back to inventory
    furniture.position = [0, 0, 0];
    furniture.rotation = [0, 0, 0];
    userRoom.inventory.push(furniture);
    this.saveToLocalStorage();
    return true;
  }

  getPlacedFurniture(userId: string): FurnitureItem[] {
    const userRoom = this.getUserRoom(userId);
    return [...userRoom.placedFurniture];
  }

  getInventory(userId: string): FurnitureItem[] {
    const userRoom = this.getUserRoom(userId);
    return [...userRoom.inventory];
  }
}

export const mockStorageService = new MockStorageService();
