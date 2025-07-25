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

// Mock data para catálogo de móveis (vazio - apenas móveis customizados)
const FURNITURE_CATALOG: Omit<FurnitureItem, 'id' | 'position' | 'rotation' | 'scale'>[] = [];

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
        this.customCatalog = data.customCatalog || [];
      } catch (error) {
        console.warn('Erro ao carregar dados do localStorage:', error);
      }
    }
  }

  private saveToLocalStorage() {
    const data = {
      userRooms: Array.from(this.userRooms.entries()),
      nextId: this.nextId,
      customCatalog: this.customCatalog
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
    return [...FURNITURE_CATALOG, ...this.customCatalog];
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

  updateFurnitureTransform(userId: string, furnitureId: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]): boolean {
    const userRoom = this.getUserRoom(userId);
    const furniture = userRoom.placedFurniture.find(item => item.id === furnitureId);

    if (!furniture) return false;

    furniture.position = position;
    furniture.rotation = rotation;
    furniture.scale = scale;
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

  addCustomFurniture(furnitureData: Omit<FurnitureItem, 'id' | 'position' | 'rotation' | 'scale'>): void {
    this.customCatalog.push(furnitureData);
    this.saveToLocalStorage();
  }
}

export const mockStorageService = new MockStorageService();
