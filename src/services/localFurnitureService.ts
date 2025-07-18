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

// Local storage interface for file data
interface LocalFurnitureData {
  furniture: CustomFurniture;
  fileData?: ArrayBuffer; // Store the actual GLB file data
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

  private setStoredFurniture(furniture: CustomFurniture[]): boolean {
    try {
      const jsonString = JSON.stringify(furniture);

      // Check approximate size (rough estimate)
      const sizeInBytes = new Blob([jsonString]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      console.log(
        `Attempting to store ${furniture.length} items (${sizeInMB.toFixed(2)}MB)`,
      );

      localStorage.setItem(this.storageKey, jsonString);
      return true;
    } catch (error) {
      console.error("Error writing to local storage:", error);

      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        console.log("Storage quota exceeded, attempting cleanup...");
        return this.handleQuotaExceeded(furniture);
      }
      return false;
    }
  }

  private handleQuotaExceeded(furniture: CustomFurniture[]): boolean {
    try {
      // Keep only the most recent 10 items
      const reducedFurniture = furniture
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 10);

      console.log(
        `Reducing from ${furniture.length} to ${reducedFurniture.length} items`,
      );

      const jsonString = JSON.stringify(reducedFurniture);
      localStorage.setItem(this.storageKey, jsonString);

      console.log("Storage cleanup successful");
      return true;
    } catch (error) {
      console.error("Failed to cleanup storage:", error);
      // Last resort: clear all furniture data
      this.clearLocalData();
      return false;
    }
  }

  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createPlaceholderUrl(fileName: string): string {
    // Create a placeholder URL instead of storing the actual file
    return `local://furniture/${fileName}`;
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

      console.log("Creating furniture metadata (file not stored locally)...");
      // Store only metadata, not the actual file (to avoid localStorage quota)
      const placeholderUrl = this.createPlaceholderUrl(file.name);

      const newFurniture: CustomFurniture = {
        id: this.generateId(),
        name: furnitureData.name,
        description: furnitureData.description,
        glb_url: placeholderUrl, // Placeholder URL instead of file content
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

      const storageSuccess = this.setStoredFurniture(updatedFurniture);

      if (!storageSuccess) {
        return {
          success: false,
          error:
            "Erro ao salvar: armazenamento local cheio. Alguns itens antigos foram removidos.",
        };
      }

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

      const storageSuccess = this.setStoredFurniture(furniture);
      return {
        success: storageSuccess,
        error: storageSuccess ? undefined : "Erro de armazenamento",
      };
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

      const storageSuccess = this.setStoredFurniture(filteredFurniture);
      return {
        success: storageSuccess,
        error: storageSuccess ? undefined : "Erro de armazenamento",
      };
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
   * Get storage information
   */
  getStorageInfo(): {
    used: number;
    itemCount: number;
    availableEstimate: number;
  } {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const usedBytes = stored ? new Blob([stored]).size : 0;
      const usedMB = usedBytes / (1024 * 1024);

      const furniture = this.getStoredFurniture();

      // Rough estimate of available space (localStorage limit is usually 5-10MB)
      const estimatedLimit = 5; // MB
      const availableMB = Math.max(0, estimatedLimit - usedMB);

      return {
        used: Number(usedMB.toFixed(2)),
        itemCount: furniture.length,
        availableEstimate: Number(availableMB.toFixed(2)),
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return { used: 0, itemCount: 0, availableEstimate: 0 };
    }
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

    const success = this.setStoredFurniture(sampleFurniture);
    if (success) {
      console.log("Sample furniture data added");
    } else {
      console.log("Failed to add sample furniture data due to storage issues");
    }
  }
}

export const localFurnitureService = LocalFurnitureService.getInstance();
