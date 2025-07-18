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
  private fileStorageKey = "custom_furniture_files";
  private objectUrls: Map<string, string> = new Map(); // Track created Object URLs
  private gltfLoader?: any; // Will be set from THREE.js

  private constructor() {
    // Import GLTFLoader dynamically
    this.initGLTFLoader();
  }

  private async initGLTFLoader() {
    try {
      const THREE = await import("three");
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader"
      );
      this.gltfLoader = new GLTFLoader();
    } catch (error) {
      console.error("Failed to load GLTFLoader:", error);
    }
  }

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

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = (error) => reject(error);
    });
  }

  private async storeFileData(
    id: string,
    arrayBuffer: ArrayBuffer,
  ): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const request = indexedDB.open("FurnitureFiles", 1);

        request.onupgradeneeded = (event) => {
          console.log("IndexedDB upgrade needed, creating object store...");
          const db = request.result;

          // Delete existing store if it exists
          if (db.objectStoreNames.contains("files")) {
            db.deleteObjectStore("files");
          }

          // Create new object store
          const objectStore = db.createObjectStore("files", { keyPath: "id" });
          console.log('Object store "files" created successfully');
        };

        request.onsuccess = () => {
          const db = request.result;

          // Verify object store exists before using it
          if (!db.objectStoreNames.contains("files")) {
            console.error('Object store "files" not found after database open');
            resolve(false);
            return;
          }

          try {
            const transaction = db.transaction(["files"], "readwrite");
            const store = transaction.objectStore("files");

            const fileData = {
              id,
              data: arrayBuffer,
              timestamp: Date.now(),
            };

            const putRequest = store.put(fileData);

            putRequest.onsuccess = () => {
              console.log(`File stored in IndexedDB: ${id}`);
            };

            putRequest.onerror = () => {
              console.error("Error in put request:", putRequest.error);
            };

            transaction.oncomplete = () => {
              console.log(`Transaction completed for: ${id}`);
              resolve(true);
            };

            transaction.onerror = (event) => {
              console.error("Transaction error:", transaction.error);
              resolve(false);
            };

            transaction.onabort = () => {
              console.error("Transaction aborted");
              resolve(false);
            };
          } catch (txError) {
            console.error("Error creating transaction:", txError);
            resolve(false);
          }
        };

        request.onerror = (event) => {
          console.error("Error opening IndexedDB:", request.error);
          resolve(false);
        };

        request.onblocked = () => {
          console.warn("IndexedDB blocked - another tab may be using it");
          resolve(false);
        };
      });
    } catch (error) {
      console.error("Error storing file data:", error);
      return false;
    }
  }

  private async getFileData(id: string): Promise<ArrayBuffer | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open("FurnitureFiles", 1);

      request.onupgradeneeded = (event) => {
        console.log(
          "IndexedDB upgrade needed during read, creating object store...",
        );
        const db = request.result;

        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", { keyPath: "id" });
          console.log('Object store "files" created during read');
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        // Check if object store exists
        if (!db.objectStoreNames.contains("files")) {
          console.error('Object store "files" not found during read');
          resolve(null);
          return;
        }

        try {
          const transaction = db.transaction(["files"], "readonly");
          const store = transaction.objectStore("files");
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            const result = getRequest.result;
            console.log(
              `File ${result ? "found" : "not found"} in IndexedDB: ${id}`,
            );
            resolve(result ? result.data : null);
          };

          getRequest.onerror = () => {
            console.error("Error in get request:", getRequest.error);
            resolve(null);
          };

          transaction.onerror = () => {
            console.error("Transaction error during read:", transaction.error);
            resolve(null);
          };
        } catch (txError) {
          console.error("Error creating read transaction:", txError);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error("Error opening IndexedDB for read:", request.error);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn("IndexedDB blocked during read");
        resolve(null);
      };
    });
  }

  private createObjectUrl(id: string, arrayBuffer: ArrayBuffer): string {
    // Clean up any existing URL for this ID
    if (this.objectUrls.has(id)) {
      URL.revokeObjectURL(this.objectUrls.get(id)!);
    }

    const blob = new Blob([arrayBuffer], { type: "model/gltf-binary" });
    const url = URL.createObjectURL(blob);
    this.objectUrls.set(id, url);

    return url;
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

      console.log("Processing GLB file for storage...");

      // Convert file to ArrayBuffer
      const arrayBuffer = await this.fileToArrayBuffer(file);

      const furnitureId = this.generateId();
      const newFurniture: CustomFurniture = {
        id: furnitureId,
        name: furnitureData.name,
        description: furnitureData.description,
        glb_url: `local://furniture/${furnitureId}`, // Local reference
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

      // Store the GLB file data in IndexedDB
      const fileStored = await this.storeFileData(newFurniture.id, arrayBuffer);

      if (!fileStored) {
        return {
          success: false,
          error:
            "Erro ao armazenar arquivo GLB. Verifique o espaço disponível.",
        };
      }

      // Get existing furniture and add new one
      const existingFurniture = this.getStoredFurniture();
      const updatedFurniture = [newFurniture, ...existingFurniture];

      const storageSuccess = this.setStoredFurniture(updatedFurniture);

      if (!storageSuccess) {
        return {
          success: false,
          error: "Erro ao salvar metadados: armazenamento local cheio.",
        };
      }

      console.log(`GLB file stored successfully for: ${newFurniture.name}`);
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
   * Load GLB model from local storage (real implementation)
   */
  async loadGLBModel(url: string): Promise<any> {
    try {
      console.log("Loading GLB model from local storage:", url);

      // Extract furniture ID from local URL
      if (!url.startsWith("local://furniture/")) {
        console.error("Invalid local furniture URL:", url);
        return null;
      }

      const furnitureId = url.replace("local://furniture/", "");

      // Get file data from IndexedDB
      const arrayBuffer = await this.getFileData(furnitureId);
      if (!arrayBuffer) {
        console.error("GLB file not found in storage:", furnitureId);
        return null;
      }

      // Create Object URL for GLTFLoader
      const objectUrl = this.createObjectUrl(furnitureId, arrayBuffer);

      // Load with GLTFLoader
      if (!this.gltfLoader) {
        console.error("GLTFLoader not initialized");
        return null;
      }

      return new Promise((resolve, reject) => {
        this.gltfLoader.load(
          objectUrl,
          (gltf: any) => {
            const model = gltf.scene;

            // Ensure model has proper shadows and materials
            model.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach((mat: any) => {
                      mat.needsUpdate = true;
                    });
                  } else {
                    child.material.needsUpdate = true;
                  }
                }
              }
            });

            // Center and scale model appropriately - using dynamic THREE import
            this.setupModelTransform(model);

            console.log("GLB model loaded successfully:", furnitureId);
            resolve(model);
          },
          (progress: any) => {
            // Loading progress
            console.log("Loading progress:", progress);
          },
          (error: any) => {
            console.error("GLTF loading error:", error);
            reject(error);
          },
        );
      });
    } catch (error) {
      console.error("Error loading GLB model:", error);
      return null;
    }
  }

  private async setupModelTransform(model: any) {
    try {
      // Dynamic import to avoid issues with THREE not being available
      const THREE = await import("three");

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the model
      model.position.sub(center);

      // Scale to reasonable size (max 3 units in any direction)
      const maxSize = Math.max(size.x, size.y, size.z);
      if (maxSize > 3) {
        const scale = 3 / maxSize;
        model.scale.setScalar(scale);
      }
    } catch (error) {
      console.error("Error setting up model transform:", error);
    }
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

      // Remove file from IndexedDB
      await this.deleteFileData(id);

      // Clean up Object URL if exists
      if (this.objectUrls.has(id)) {
        URL.revokeObjectURL(this.objectUrls.get(id)!);
        this.objectUrls.delete(id);
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

  private async deleteFileData(id: string): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open("FurnitureFiles", 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["files"], "readwrite");
        const store = transaction.objectStore("files");

        store.delete(id);

        transaction.oncomplete = () => {
          console.log("File deleted from IndexedDB:", id);
          resolve();
        };

        transaction.onerror = () => {
          console.error("Error deleting file from IndexedDB");
          resolve();
        };
      };

      request.onerror = () => {
        console.error("Error opening IndexedDB for delete");
        resolve();
      };
    });
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
