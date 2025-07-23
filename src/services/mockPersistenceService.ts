// Mock Persistence Service - Simula um banco de dados usando localStorage

export interface CatalogItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: 'Móveis Básicos' | 'Móveis Limitados';
  modelUrl?: string; // URL do modelo GLB
  createdBy: string; // Admin que criou
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  catalogItemId: string;
  userId: string;
  purchasedAt: string;
  status: 'novo' | 'equipado';
}

export interface PlacedFurniture {
  id: string;
  inventoryItemId: string;
  userId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  placedAt: string;
  updatedAt: string;
}

export interface UserRoom {
  userId: string;
  placedFurniture: PlacedFurniture[];
  lastModified: string;
}

export interface UserProfile {
  id: string;
  username: string;
  coins: number;
  isAdmin: boolean;
}

class MockPersistenceService {
  private readonly STORAGE_KEYS = {
    CATALOG: 'xenopets_catalog',
    INVENTORY: 'xenopets_inventory',
    ROOMS: 'xenopets_rooms',
    USERS: 'xenopets_users',
    CURRENT_USER: 'xenopets_current_user'
  };

  // Initialize with default data
  init() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize catalog if empty
    if (!localStorage.getItem(this.STORAGE_KEYS.CATALOG)) {
      const defaultCatalog: CatalogItem[] = [
        {
          id: 'mesa-1',
          name: 'Mesa',
          emoji: '🪑',
          price: 100,
          category: 'Móveis Básicos',
          createdBy: 'system',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cadeira-1',
          name: 'Cadeira',
          emoji: '🪑',
          price: 50,
          category: 'Móveis Básicos',
          createdBy: 'system',
          createdAt: new Date().toISOString()
        },
        {
          id: 'sofa-1',
          name: 'Sofá',
          emoji: '🛋️',
          price: 180,
          category: 'Móveis Básicos',
          createdBy: 'system',
          createdAt: new Date().toISOString()
        },
        {
          id: 'trono-1',
          name: 'Trono',
          emoji: '👑',
          price: 500,
          category: 'Móveis Limitados',
          createdBy: 'system',
          createdAt: new Date().toISOString()
        }
      ];
      this.saveCatalog(defaultCatalog);
    }

    // Initialize users if empty
    if (!localStorage.getItem(this.STORAGE_KEYS.USERS)) {
      const defaultUsers: UserProfile[] = [
        {
          id: 'admin-1',
          username: 'Admin',
          coins: 10000,
          isAdmin: true
        },
        {
          id: 'player-1',
          username: 'Player1',
          coins: 1250,
          isAdmin: false
        }
      ];
      this.saveUsers(defaultUsers);
    }
  }

  // Catalog Management
  getCatalog(): CatalogItem[] {
    const catalog = localStorage.getItem(this.STORAGE_KEYS.CATALOG);
    return catalog ? JSON.parse(catalog) : [];
  }

  saveCatalog(items: CatalogItem[]): void {
    localStorage.setItem(this.STORAGE_KEYS.CATALOG, JSON.stringify(items));
  }

  addToCatalog(item: Omit<CatalogItem, 'id' | 'createdAt'>): CatalogItem {
    const catalog = this.getCatalog();
    const newItem: CatalogItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    catalog.push(newItem);
    this.saveCatalog(catalog);
    return newItem;
  }

  // Inventory Management
  getInventory(userId: string): InventoryItem[] {
    const inventory = localStorage.getItem(this.STORAGE_KEYS.INVENTORY);
    const allInventory: InventoryItem[] = inventory ? JSON.parse(inventory) : [];
    return allInventory.filter(item => item.userId === userId);
  }

  saveInventory(items: InventoryItem[]): void {
    localStorage.setItem(this.STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  }

  addToInventory(catalogItemId: string, userId: string): InventoryItem {
    const allInventory = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.INVENTORY) || '[]');
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      catalogItemId,
      userId,
      purchasedAt: new Date().toISOString(),
      status: 'novo'
    };
    allInventory.push(newItem);
    this.saveInventory(allInventory);
    return newItem;
  }

  updateInventoryItemStatus(itemId: string, status: 'novo' | 'equipado'): void {
    const allInventory = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.INVENTORY) || '[]');
    const itemIndex = allInventory.findIndex((item: InventoryItem) => item.id === itemId);
    if (itemIndex !== -1) {
      allInventory[itemIndex].status = status;
      this.saveInventory(allInventory);
    }
  }

  // Room Management
  getUserRoom(userId: string): UserRoom | null {
    const rooms = localStorage.getItem(this.STORAGE_KEYS.ROOMS);
    const allRooms: UserRoom[] = rooms ? JSON.parse(rooms) : [];
    return allRooms.find(room => room.userId === userId) || null;
  }

  saveUserRoom(room: UserRoom): void {
    const allRooms = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ROOMS) || '[]');
    const existingIndex = allRooms.findIndex((r: UserRoom) => r.userId === room.userId);
    
    room.lastModified = new Date().toISOString();
    
    if (existingIndex !== -1) {
      allRooms[existingIndex] = room;
    } else {
      allRooms.push(room);
    }
    
    localStorage.setItem(this.STORAGE_KEYS.ROOMS, JSON.stringify(allRooms));
  }

  addFurnitureToRoom(userId: string, furniture: Omit<PlacedFurniture, 'id' | 'placedAt' | 'updatedAt'>): PlacedFurniture {
    let room = this.getUserRoom(userId);
    if (!room) {
      room = {
        userId,
        placedFurniture: [],
        lastModified: new Date().toISOString()
      };
    }

    const newFurniture: PlacedFurniture = {
      ...furniture,
      id: `furn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      placedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    room.placedFurniture.push(newFurniture);
    this.saveUserRoom(room);
    return newFurniture;
  }

  updateFurniturePosition(userId: string, furnitureId: string, position: { x: number; y: number; z: number }, rotation?: { x: number; y: number; z: number }): void {
    const room = this.getUserRoom(userId);
    if (!room) return;

    const furnitureIndex = room.placedFurniture.findIndex(f => f.id === furnitureId);
    if (furnitureIndex !== -1) {
      room.placedFurniture[furnitureIndex].position = position;
      if (rotation) {
        room.placedFurniture[furnitureIndex].rotation = rotation;
      }
      room.placedFurniture[furnitureIndex].updatedAt = new Date().toISOString();
      this.saveUserRoom(room);
    }
  }

  removeFurnitureFromRoom(userId: string, furnitureId: string): void {
    const room = this.getUserRoom(userId);
    if (!room) return;

    room.placedFurniture = room.placedFurniture.filter(f => f.id !== furnitureId);
    this.saveUserRoom(room);
  }

  // User Management
  getUsers(): UserProfile[] {
    const users = localStorage.getItem(this.STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  }

  saveUsers(users: UserProfile[]): void {
    localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getUserById(userId: string): UserProfile | null {
    const users = this.getUsers();
    return users.find(user => user.id === userId) || null;
  }

  updateUserCoins(userId: string, newAmount: number): void {
    const users = this.getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      users[userIndex].coins = newAmount;
      this.saveUsers(users);
    }
  }

  getCurrentUser(): UserProfile | null {
    const currentUserId = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
    if (!currentUserId) return null;
    return this.getUserById(currentUserId);
  }

  setCurrentUser(userId: string): void {
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, userId);
  }

  // Purchase System
  purchaseItem(userId: string, catalogItemId: string): { success: boolean; message: string; inventoryItem?: InventoryItem } {
    const user = this.getUserById(userId);
    const catalog = this.getCatalog();
    const item = catalog.find(i => i.id === catalogItemId);

    if (!user) return { success: false, message: 'Usuário não encontrado' };
    if (!item) return { success: false, message: 'Item não encontrado no catálogo' };
    if (user.coins < item.price) return { success: false, message: 'Moedas insuficientes' };

    // Deduct coins
    this.updateUserCoins(userId, user.coins - item.price);
    
    // Add to inventory
    const inventoryItem = this.addToInventory(catalogItemId, userId);

    return { 
      success: true, 
      message: `${item.name} adicionado ao inventário!`, 
      inventoryItem 
    };
  }

  // Debug/Development helpers
  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.init();
  }

  exportData(): string {
    const data = {
      catalog: this.getCatalog(),
      inventory: JSON.parse(localStorage.getItem(this.STORAGE_KEYS.INVENTORY) || '[]'),
      rooms: JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ROOMS) || '[]'),
      users: this.getUsers()
    };
    return JSON.stringify(data, null, 2);
  }
}

export const mockPersistenceService = new MockPersistenceService();
