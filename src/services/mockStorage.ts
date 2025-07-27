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
  quantity?: number;
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
  private customSections: string[] = [];

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
        this.customSections = data.customSections || [];
      } catch (error) {
        console.warn('Erro ao carregar dados do localStorage:', error);
      }
    }
  }

  private saveToLocalStorage() {
    const data = {
      userRooms: Array.from(this.userRooms.entries()),
      nextId: this.nextId,
      customCatalog: this.customCatalog,
      customSections: this.customSections
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

    // Procurar item existente no inventário com mesmo name e model
    const existingItem = userRoom.inventory.find(item =>
      item.name === catalogItem.name &&
      item.model === catalogItem.model &&
      item.category === catalogItem.category
    );

    if (existingItem) {
      // Se existe, incrementar quantity
      existingItem.quantity = (existingItem.quantity || 1) + 1;
      this.saveToLocalStorage();
      return existingItem;
    } else {
      // Se não existe, criar novo com quantity = 1
      const newItem: FurnitureItem = {
        ...catalogItem,
        id: this.generateId(),
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: (catalogItem as any).defaultScale || [1, 1, 1],
        quantity: 1
      };

      userRoom.inventory.push(newItem);
      this.saveToLocalStorage();
      return newItem;
    }
  }

  placeFurniture(userId: string, furnitureId: string, position: [number, number, number]): boolean {
    const userRoom = this.getUserRoom(userId);
    const inventoryIndex = userRoom.inventory.findIndex(item => item.id === furnitureId);

    if (inventoryIndex === -1) return false;

    const furniture = userRoom.inventory[inventoryIndex];

    // Criar uma nova instância do móvel para colocar
    const placedFurniture: FurnitureItem = {
      ...furniture,
      id: this.generateId(), // Novo ID para o móvel posicionado
      position: position,
      quantity: 1 // Móveis colocados sempre têm quantity 1
    };

    userRoom.placedFurniture.push(placedFurniture);

    // Decrementar quantidade no inventário
    if (furniture.quantity && furniture.quantity > 1) {
      furniture.quantity -= 1;
    } else {
      // Se só tem 1, remover do inventário
      userRoom.inventory.splice(inventoryIndex, 1);
    }

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

    // Procurar item existente no inventário com mesmo name e model
    const existingItem = userRoom.inventory.find(item =>
      item.name === furniture.name &&
      item.model === furniture.model &&
      item.category === furniture.category
    );

    if (existingItem) {
      // Se existe, incrementar quantity
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      // Se não existe, criar novo com quantity = 1
      const inventoryItem: FurnitureItem = {
        ...furniture,
        id: this.generateId(), // Novo ID para o inventário
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        quantity: 1
      };
      userRoom.inventory.push(inventoryItem);
    }

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

  updateCatalogItemScale(furnitureId: string, newScale: [number, number, number]): boolean {
    // Encontrar o móvel colocado pelo ID
    let targetFurniture: FurnitureItem | undefined;
    let foundRoom: UserRoom | undefined;

    for (const room of this.userRooms.values()) {
      const furniture = room.placedFurniture.find(f => f.id === furnitureId);
      if (furniture) {
        targetFurniture = furniture;
        foundRoom = room;
        break;
      }
    }

    if (!targetFurniture) return false;

    // Encontrar o item correspondente no catálogo customizado
    const catalogItem = this.customCatalog.find(item => item.model === targetFurniture!.model);

    if (catalogItem) {
      // Atualizar a escala padrão do item no catálogo
      (catalogItem as any).defaultScale = newScale;
      this.saveToLocalStorage();

      console.log(`Escala padrão do móvel '${catalogItem.name}' atualizada para:`, newScale);
      console.log('Novos móveis comprados terão esta escala automaticamente.');

      return true;
    }

    return false;
  }

  createCustomSection(sectionName: string): boolean {
    const normalizedName = sectionName.toLowerCase().trim();

    // Verificar se a seção já existe (customizada ou básica)
    const allSections = this.getAllSections();
    if (allSections.includes(normalizedName)) {
      return false; // Seção já existe
    }

    this.customSections.push(normalizedName);
    this.saveToLocalStorage();
    console.log('Nova seção criada:', sectionName, 'ID:', normalizedName);
    console.log('Seções customizadas atuais:', this.customSections);
    return true;
  }

  getCustomSections(): string[] {
    return [...this.customSections];
  }

  getAllSections(): string[] {
    return [...this.customSections];
  }

  deleteSection(sectionName: string): boolean {
    const normalizedName = sectionName.toLowerCase().trim();

    // Verificar se é uma seção customizada
    const sectionIndex = this.customSections.indexOf(normalizedName);
    if (sectionIndex !== -1) {
      // Remover seção customizada
      this.customSections.splice(sectionIndex, 1);
    }

    // Remover todos os móveis dessa seção do catálogo customizado
    // IMPORTANTE: Não remove móveis já comprados/posicionados pelos usuários
    this.customCatalog = this.customCatalog.filter(item => item.category !== normalizedName);

    this.saveToLocalStorage();
    console.log('Seção excluída:', sectionName, 'ID:', normalizedName);
    console.log('Móveis da seção removidos do catálogo (não afeta móveis já adquiridos)');
    console.log('Seções restantes:', this.customSections);
    return true;
  }

  deleteFurnitureFromSection(sectionName: string, furnitureIndex: number): boolean {
    const normalizedSection = sectionName.toLowerCase().trim();

    // Encontrar móveis dessa seção
    const sectionFurniture = this.customCatalog.filter(item => item.category === normalizedSection);

    if (furnitureIndex < 0 || furnitureIndex >= sectionFurniture.length) {
      return false; // Índice inválido
    }

    const furnitureToDelete = sectionFurniture[furnitureIndex];

    // Remover o móvel do catálogo customizado
    const catalogIndex = this.customCatalog.findIndex(item =>
      item.model === furnitureToDelete.model && item.name === furnitureToDelete.name
    );

    if (catalogIndex !== -1) {
      this.customCatalog.splice(catalogIndex, 1);
      this.saveToLocalStorage();
      console.log('Móvel excluído:', furnitureToDelete.name, 'da seção:', sectionName);
      return true;
    }

    return false;
  }

  getFurnitureBySection(sectionName: string): Omit<FurnitureItem, 'id' | 'position' | 'rotation' | 'scale'>[] {
    const normalizedSection = sectionName.toLowerCase().trim();
    return this.customCatalog.filter(item => item.category === normalizedSection);
  }
}

export const mockStorageService = new MockStorageService();
