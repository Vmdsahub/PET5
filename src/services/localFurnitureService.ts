export interface CustomFurniture {
  id: string;
  name: string;
  description?: string;
  glb_url: string;
  thumbnail_url?: string;
  price: number;
  currency: "xenocoins" | "cash";
  created_by?: string;
  is_active: boolean;
  category: "admin" | "premium" | "seasonal";
  tags?: string[];
  metadata?: {
    scale?: { min: number; max: number };
    lighting?: boolean;
    interactive?: boolean;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface FurnitureUploadData {
  name: string;
  description?: string;
  price?: number;
  currency?: "xenocoins" | "cash";
  category?: "admin" | "premium" | "seasonal";
  tags?: string[];
  metadata?: object;
}

class LocalFurnitureService {
  private static instance: LocalFurnitureService;
  private storageKey = "custom_furniture_local";

  private constructor() {}

  public static getInstance(): LocalFurnitureService {
    if (!LocalFurnitureService.instance) {
      LocalFurnitureService.instance = new LocalFurnitureService();
    }
    return LocalFurnitureService.instance;
  }

  private getStoredFurniture(): CustomFurniture[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error reading local storage:", error);
      return [];
    }
  }

  private setStoredFurniture(furniture: CustomFurniture[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(furniture));
    } catch (error) {
      console.error("Error writing to local storage:", error);
    }
  }

  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Upload GLB file and create custom furniture (local version)
   */
  async uploadFurniture(
    file: File,
    furnitureData: FurnitureUploadData,
  ): Promise<{
    success: boolean;
    furniture?: CustomFurniture;
    error?: string;
  }> {
    try {
      // Validate file
      if (!file.name.toLowerCase().endsWith(".glb")) {
        return { success: false, error: "Apenas arquivos GLB são suportados" };
      }

      if (file.size > 100 * 1024 * 1024) {
        // 100MB limit
        return { success: false, error: "Arquivo muito grande. Máximo: 100MB" };
      }

      console.log("Converting file to base64...");
      // Convert file to base64 for local storage
      const base64File = await this.fileToBase64(file);

      const newFurniture: CustomFurniture = {
        id: this.generateId(),
        name: furnitureData.name,
        description: furnitureData.description,
        glb_url: base64File, // Store as base64 data URL
        thumbnail_url: undefined,
        price: furnitureData.price || 0,
        currency: furnitureData.currency || "xenocoins",
        category: furnitureData.category || "admin",
        tags: furnitureData.tags || [],
        metadata: furnitureData.metadata || {},
        created_by: "local_admin",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Saving furniture locally:", newFurniture);

      // Get existing furniture and add new one
      const existingFurniture = this.getStoredFurniture();
      const updatedFurniture = [newFurniture, ...existingFurniture];
      this.setStoredFurniture(updatedFurniture);

      return { success: true, furniture: newFurniture };
    } catch (error) {
      console.error("Local upload furniture error:", error);
      return { success: false, error: "Erro interno do sistema local" };
    }
  }

  /**
   * Get all custom furniture (local version)
   */
  async getAllCustomFurniture(): Promise<CustomFurniture[]> {
    try {
      console.log("Fetching custom furniture from local storage...");
      const furniture = this.getStoredFurniture();
      const activeFurniture = furniture.filter((item) => item.is_active);
      console.log("Local furniture loaded:", activeFurniture);
      return activeFurniture;
    } catch (error) {
      console.error("Get local custom furniture error:", error);
      return [];
    }
  }

  /**
   * Get custom furniture by category (local version)
   */
  async getFurnitureByCategory(category: string): Promise<CustomFurniture[]> {
    try {
      const allFurniture = this.getStoredFurniture();
      return allFurniture.filter(
        (item) => item.category === category && item.is_active,
      );
    } catch (error) {
      console.error("Get local furniture by category error:", error);
      return [];
    }
  }

  /**
   * Load GLB model from base64 data URL (local version)
   */
  async loadGLBModel(dataUrl: string): Promise<any> {
    // For local version, we'll just return a placeholder
    // In a real implementation, you'd need to decode the base64 and load with THREE.js
    console.log("Loading GLB model from data URL (local version)");
    return null;
  }

  /**
   * Update custom furniture (local version)
   */
  async updateFurniture(
    id: string,
    updates: Partial<FurnitureUploadData>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const furniture = this.getStoredFurniture();
      const index = furniture.findIndex((item) => item.id === id);

      if (index === -1) {
        return { success: false, error: "Móvel não encontrado" };
      }

      furniture[index] = {
        ...furniture[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      this.setStoredFurniture(furniture);
      return { success: true };
    } catch (error) {
      console.error("Update local furniture error:", error);
      return { success: false, error: "Erro ao atualizar móvel" };
    }
  }

  /**
   * Delete custom furniture (local version)
   */
  async deleteFurniture(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const furniture = this.getStoredFurniture();
      const filteredFurniture = furniture.filter((item) => item.id !== id);

      if (filteredFurniture.length === furniture.length) {
        return { success: false, error: "Móvel não encontrado" };
      }

      this.setStoredFurniture(filteredFurniture);
      return { success: true };
    } catch (error) {
      console.error("Delete local furniture error:", error);
      return { success: false, error: "Erro ao deletar móvel" };
    }
  }

  /**
   * Purchase custom furniture (local version)
   */
  async purchaseCustomFurniture(
    furnitureId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; newBalance?: number }> {
    try {
      const furniture = this.getStoredFurniture();
      const targetFurniture = furniture.find(
        (item) => item.id === furnitureId && item.is_active,
      );

      if (!targetFurniture) {
        return { success: false, message: "Móvel não encontrado" };
      }

      // For local version, all admin items are free
      return {
        success: true,
        message: `Móvel "${targetFurniture.name}" adquirido com sucesso!`,
        newBalance: 0,
      };
    } catch (error) {
      console.error("Purchase local custom furniture error:", error);
      return { success: false, message: "Erro ao comprar móvel" };
    }
  }

  /**
   * Get user's custom furniture inventory (local version)
   */
  async getUserCustomFurniture(userId: string): Promise<CustomFurniture[]> {
    try {
      // For local version, return all furniture as available
      return this.getStoredFurniture();
    } catch (error) {
      console.error("Get user local custom furniture error:", error);
      return [];
    }
  }

  /**
   * Clear all local data (for testing)
   */
  clearLocalData(): void {
    localStorage.removeItem(this.storageKey);
    console.log("Local furniture data cleared");
  }

  /**
   * Add sample data for testing
   */
  addSampleData(): void {
    const sampleFurniture: CustomFurniture[] = [
      {
        id: "sample_1",
        name: "Mesa de Teste Local",
        description: "Uma mesa de teste armazenada localmente",
        glb_url: "data:text/plain;base64,dGVzdGU=", // dummy base64
        price: 0,
        currency: "xenocoins",
        category: "admin",
        tags: ["teste", "local"],
        is_active: true,
        created_by: "local_admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
      },
      {
        id: "sample_2",
        name: "Cadeira Local",
        description: "Uma cadeira de exemplo no armazenamento local",
        glb_url: "data:text/plain;base64,dGVzdGUy", // dummy base64
        price: 0,
        currency: "xenocoins",
        category: "admin",
        tags: ["teste", "cadeira"],
        is_active: true,
        created_by: "local_admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
      },
    ];

    this.setStoredFurniture(sampleFurniture);
    console.log("Sample furniture data added");
  }
}

export const localFurnitureService = LocalFurnitureService.getInstance();
