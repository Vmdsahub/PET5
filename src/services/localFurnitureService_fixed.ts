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
  private objectUrls: Map<string, string> = new Map();
  private gltfLoader?: any;

  private constructor() {
    this.initGLTFLoader();
  }

  public static getInstance(): LocalFurnitureService {
    if (!LocalFurnitureService.instance) {
      LocalFurnitureService.instance = new LocalFurnitureService();
    }
    return LocalFurnitureService.instance;
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
      localStorage.setItem(this.storageKey, jsonString);
      return true;
    } catch (error) {
      console.error("Error writing to local storage:", error);
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

  private async ensureIndexedDB(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      // Force a clean database by using timestamp as version
      const version = Date.now();
      console.log(`🗃️ Opening IndexedDB version: ${version}`);

      const request = indexedDB.open("FurnitureFiles", version);

      request.onupgradeneeded = () => {
        console.log("📦 IndexedDB upgrade triggered");
        const db = request.result;

        // Clear existing stores
        for (const storeName of Array.from(db.objectStoreNames)) {
          console.log(`🗑️ Removing old store: ${storeName}`);
          db.deleteObjectStore(storeName);
        }

        // Create fresh store
        const store = db.createObjectStore("files", { keyPath: "id" });
        console.log('✅ Created fresh "files" object store');
      };

      request.onsuccess = () => {
        const db = request.result;
        console.log("✅ IndexedDB opened successfully");

        if (!db.objectStoreNames.contains("files")) {
          console.error("❌ Files store missing after creation");
          db.close();
          resolve(null);
          return;
        }

        resolve(db);
      };

      request.onerror = () => {
        console.error("❌ Failed to open IndexedDB:", request.error);
        resolve(null);
      };
    });
  }

  private async storeFileData(
    id: string,
    arrayBuffer: ArrayBuffer,
  ): Promise<boolean> {
    try {
      console.log(
        `💾 Storing file ${id} (${(arrayBuffer.byteLength / 1024).toFixed(1)}KB)`,
      );

      const db = await this.ensureIndexedDB();
      if (!db) {
        console.error("❌ Failed to get IndexedDB");
        return false;
      }

      return new Promise((resolve) => {
        const transaction = db.transaction(["files"], "readwrite");
        const store = transaction.objectStore("files");

        const data = {
          id,
          data: arrayBuffer,
          timestamp: Date.now(),
        };

        const request = store.put(data);

        transaction.oncomplete = () => {
          console.log(`✅ File ${id} stored successfully`);
          db.close();
          resolve(true);
        };

        transaction.onerror = () => {
          console.error(`❌ Failed to store file ${id}:`, transaction.error);
          db.close();
          resolve(false);
        };
      });
    } catch (error) {
      console.error(`❌ Error storing file ${id}:`, error);
      return false;
    }
  }

  private async getFileData(id: string): Promise<ArrayBuffer | null> {
    try {
      const db = await this.ensureIndexedDB();
      if (!db) return null;

      return new Promise((resolve) => {
        const transaction = db.transaction(["files"], "readonly");
        const store = transaction.objectStore("files");
        const request = store.get(id);

        request.onsuccess = () => {
          const result = request.result;
          db.close();
          resolve(result ? result.data : null);
        };

        request.onerror = () => {
          console.error(`❌ Failed to get file ${id}`);
          db.close();
          resolve(null);
        };
      });
    } catch (error) {
      console.error(`❌ Error getting file ${id}:`, error);
      return null;
    }
  }

  private createObjectUrl(id: string, arrayBuffer: ArrayBuffer): string {
    if (this.objectUrls.has(id)) {
      URL.revokeObjectURL(this.objectUrls.get(id)!);
    }

    const blob = new Blob([arrayBuffer], { type: "model/gltf-binary" });
    const url = URL.createObjectURL(blob);
    this.objectUrls.set(id, url);

    return url;
  }

  async uploadFurniture(
    file: File,
    furnitureData: FurnitureUploadData,
  ): Promise<{
    success: boolean;
    furniture?: CustomFurniture;
    error?: string;
  }> {
    try {
      if (!file.name.toLowerCase().endsWith(".glb")) {
        return { success: false, error: "Apenas arquivos GLB são suportados" };
      }

      if (file.size > 100 * 1024 * 1024) {
        return { success: false, error: "Arquivo muito grande. Máximo: 100MB" };
      }

      console.log("🔄 Processing GLB file for upload...");
      const arrayBuffer = await this.fileToArrayBuffer(file);

      const furnitureId = this.generateId();
      const newFurniture: CustomFurniture = {
        id: furnitureId,
        name: furnitureData.name,
        description: furnitureData.description,
        glb_url: `local://furniture/${furnitureId}`,
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

      console.log("💾 Storing GLB file...");
      const fileStored = await this.storeFileData(furnitureId, arrayBuffer);

      if (!fileStored) {
        return {
          success: false,
          error: "Erro ao armazenar arquivo GLB",
        };
      }

      const existingFurniture = this.getStoredFurniture();
      const updatedFurniture = [newFurniture, ...existingFurniture];

      const metadataStored = this.setStoredFurniture(updatedFurniture);
      if (!metadataStored) {
        return {
          success: false,
          error: "Erro ao salvar metadados",
        };
      }

      console.log(`✅ Furniture ${newFurniture.name} uploaded successfully`);
      return { success: true, furniture: newFurniture };
    } catch (error) {
      console.error("Upload error:", error);
      return { success: false, error: "Erro interno do sistema" };
    }
  }

  async getAllCustomFurniture(): Promise<CustomFurniture[]> {
    try {
      const furniture = this.getStoredFurniture();
      const activeFurniture = furniture.filter((item) => item.is_active);
      console.log(`📋 Loaded ${activeFurniture.length} active furniture items`);
      return activeFurniture;
    } catch (error) {
      console.error("Error loading furniture:", error);
      return [];
    }
  }

  async loadGLBModel(url: string): Promise<any> {
    try {
      console.log("🎯 Loading GLB model:", url);

      if (!url.startsWith("local://furniture/")) {
        console.error("❌ Invalid local furniture URL");
        return null;
      }

      const furnitureId = url.replace("local://furniture/", "");
      const arrayBuffer = await this.getFileData(furnitureId);

      if (!arrayBuffer) {
        console.error("❌ GLB file not found:", furnitureId);
        return null;
      }

      const objectUrl = this.createObjectUrl(furnitureId, arrayBuffer);

      if (!this.gltfLoader) {
        console.error("❌ GLTFLoader not initialized");
        return null;
      }

      return new Promise((resolve, reject) => {
        this.gltfLoader.load(
          objectUrl,
          (gltf: any) => {
            const model = gltf.scene;

            // Setup model properties
            model.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach(
                      (mat: any) => (mat.needsUpdate = true),
                    );
                  } else {
                    child.material.needsUpdate = true;
                  }
                }
              }
            });

            this.setupModelTransform(model);
            console.log("✅ GLB model loaded successfully:", furnitureId);
            resolve(model);
          },
          undefined,
          (error: any) => {
            console.error("❌ GLTF loading error:", error);
            reject(error);
          },
        );
      });
    } catch (error) {
      console.error("❌ Error loading GLB model:", error);
      return null;
    }
  }

  private async setupModelTransform(model: any) {
    try {
      const THREE = await import("three");
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.sub(center);

      const maxSize = Math.max(size.x, size.y, size.z);
      if (maxSize > 3) {
        const scale = 3 / maxSize;
        model.scale.setScalar(scale);
      }
    } catch (error) {
      console.error("Error setting up model transform:", error);
    }
  }

  async deleteFurniture(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const furniture = this.getStoredFurniture();
      const filteredFurniture = furniture.filter((item) => item.id !== id);

      if (filteredFurniture.length === furniture.length) {
        return { success: false, error: "Móvel não encontrado" };
      }

      // Clean up resources
      if (this.objectUrls.has(id)) {
        URL.revokeObjectURL(this.objectUrls.get(id)!);
        this.objectUrls.delete(id);
      }

      const success = this.setStoredFurniture(filteredFurniture);
      return { success, error: success ? undefined : "Erro de armazenamento" };
    } catch (error) {
      console.error("Delete error:", error);
      return { success: false, error: "Erro ao deletar móvel" };
    }
  }

  async testIndexedDB(): Promise<boolean> {
    try {
      console.log("🧪 Testing IndexedDB...");
      const testData = new ArrayBuffer(100);

      const stored = await this.storeFileData("test_id", testData);
      if (!stored) return false;

      const retrieved = await this.getFileData("test_id");
      if (!retrieved) return false;

      console.log("✅ IndexedDB test passed");
      return true;
    } catch (error) {
      console.error("❌ IndexedDB test failed:", error);
      return false;
    }
  }

  clearLocalData(): void {
    localStorage.removeItem(this.storageKey);
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
    console.log("🗑️ Local data cleared");
  }

  addSampleData(): void {
    const sampleFurniture: CustomFurniture[] = [
      {
        id: "sample_1",
        name: "Mesa de Teste Local",
        description: "Uma mesa de teste armazenada localmente",
        glb_url: "data:text/plain;base64,dGVzdGU=",
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
    ];

    const success = this.setStoredFurniture(sampleFurniture);
    if (success) {
      console.log("✅ Sample furniture data added");
    } else {
      console.log("❌ Failed to add sample furniture data");
    }
  }

  getStorageInfo() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const usedBytes = stored ? new Blob([stored]).size : 0;
      const usedMB = usedBytes / (1024 * 1024);
      const furniture = this.getStoredFurniture();
      const estimatedLimit = 5;
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
}

export const localFurnitureService = LocalFurnitureService.getInstance();
