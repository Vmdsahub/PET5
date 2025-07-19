import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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
  catalogSection?: "admin" | "basic" | "xenocash" | "limited"; // Which catalog section to show in
  tags?: string[];
  metadata?: any;
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

class SimpleFurnitureService {
  private static instance: SimpleFurnitureService;
  private furniture: Map<string, CustomFurniture> = new Map();
  private glbFiles: Map<string, Blob> = new Map(); // Store GLB files as blobs
  private objectUrls: Map<string, string> = new Map();
  private gltfLoader: GLTFLoader;

  private constructor() {
    this.gltfLoader = new GLTFLoader();
  }

  public static getInstance(): SimpleFurnitureService {
    if (!SimpleFurnitureService.instance) {
      SimpleFurnitureService.instance = new SimpleFurnitureService();
    }
    return SimpleFurnitureService.instance;
  }

  private generateId(): string {
    return `furniture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      console.log("📤 Uploading furniture:", furnitureData.name);

      // Validate file
      if (!file.name.toLowerCase().endsWith(".glb")) {
        return { success: false, error: "Apenas arquivos GLB são suportados" };
      }

      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        return { success: false, error: "Arquivo muito grande. Máximo: 50MB" };
      }

      const furnitureId = this.generateId();

      // Store the GLB file as a blob
      this.glbFiles.set(furnitureId, file);

      // Create object URL for immediate use
      const objectUrl = URL.createObjectURL(file);
      this.objectUrls.set(furnitureId, objectUrl);

      const newFurniture: CustomFurniture = {
        id: furnitureId,
        name: furnitureData.name,
        description: furnitureData.description || "",
        glb_url: `memory://furniture/${furnitureId}`,
        thumbnail_url: undefined,
        price: 0, // Admin items are free
        currency: "xenocoins",
        category: "admin",
        catalogSection: "admin", // Default to admin section
        tags: furnitureData.tags || [],
        metadata: furnitureData.metadata || {},
        created_by: "admin",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.furniture.set(furnitureId, newFurniture);

      console.log("✅ Furniture uploaded successfully:", newFurniture.name);
      return { success: true, furniture: newFurniture };
    } catch (error) {
      console.error("❌ Upload error:", error);
      return { success: false, error: "Erro interno do sistema" };
    }
  }

  async getAllCustomFurniture(): Promise<CustomFurniture[]> {
    const furniture = Array.from(this.furniture.values())
      .filter((f) => f.is_active)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    console.log(`📋 Loaded ${furniture.length} furniture items`);
    return furniture;
  }

  async loadGLBModel(url: string): Promise<any> {
    try {
      console.log("🎯 Loading GLB model:", url);

      if (!url.startsWith("memory://furniture/")) {
        console.error("❌ Invalid memory furniture URL:", url);
        return null;
      }

      const furnitureId = url.replace("memory://furniture/", "");
      const objectUrl = this.objectUrls.get(furnitureId);

      if (!objectUrl) {
        console.error("❌ Object URL not found for:", furnitureId);
        return null;
      }

      return new Promise((resolve, reject) => {
        this.gltfLoader.load(
          objectUrl,
          (gltf) => {
            const model = gltf.scene;

            // Setup shadows and materials
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

            // Center and scale the model
            this.setupModelTransform(model);

            console.log("✅ GLB model loaded successfully:", furnitureId);
            resolve(model);
          },
          undefined,
          (error) => {
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

      // Center the model
      model.position.sub(center);

      // Scale to reasonable size (max 3 units in any direction)
      const maxSize = Math.max(size.x, size.y, size.z);
      if (maxSize > 3) {
        const scale = 3 / maxSize;
        model.scale.setScalar(scale);
      }

      console.log(`📏 Model scaled to fit: ${model.scale.x.toFixed(2)}x`);
    } catch (error) {
      console.error("❌ Error setting up model transform:", error);
    }
  }

  async deleteFurniture(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.furniture.has(id)) {
        return { success: false, error: "Móvel não encontrado" };
      }

      // Clean up resources
      const objectUrl = this.objectUrls.get(id);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        this.objectUrls.delete(id);
      }

      this.glbFiles.delete(id);
      this.furniture.delete(id);

      console.log("🗑️ Furniture deleted:", id);
      return { success: true };
    } catch (error) {
      console.error("❌ Delete error:", error);
      return { success: false, error: "Erro ao deletar móvel" };
    }
  }

  clearAll(): void {
    // Clean up all object URLs
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));

    // Clear all data
    this.furniture.clear();
    this.glbFiles.clear();
    this.objectUrls.clear();

    console.log("🗑️ All furniture data cleared");
  }

  addSampleData(): void {
    const sampleId = this.generateId();
    const sampleFurniture: CustomFurniture = {
      id: sampleId,
      name: "Sofá Teste GLB",
      description: "Móvel GLB de teste para validar thumbnails",
      glb_url: "https://threejs.org/examples/models/gltf/Flamingo.glb", // URL de teste público
      price: 0,
      currency: "xenocoins",
      category: "admin",
      tags: ["teste", "glb"],
      is_active: true,
      created_by: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
    };

    this.furniture.set(sampleId, sampleFurniture);
    console.log(
      "✅ Sample GLB furniture added with URL:",
      sampleFurniture.glb_url,
    );
  }

  getCount(): number {
    return this.furniture.size;
  }

  // Update catalog section for a furniture item
  updateFurnitureCatalogSection(
    furnitureId: string,
    newSection: "admin" | "basic" | "xenocash" | "limited",
  ): { success: boolean; error?: string } {
    const furniture = this.furniture.get(furnitureId);

    if (!furniture) {
      return { success: false, error: "Móvel não encontrado" };
    }

    // Update the catalog section
    furniture.catalogSection = newSection;
    furniture.updated_at = new Date().toISOString();

    this.furniture.set(furnitureId, furniture);

    console.log(
      `✅ Updated furniture ${furnitureId} to section: ${newSection}`,
    );
    return { success: true };
  }

  // Get furniture by catalog section
  getFurnitureBySection(
    section: "admin" | "basic" | "xenocash" | "limited",
  ): CustomFurniture[] {
    return Array.from(this.furniture.values()).filter(
      (furniture) => (furniture.catalogSection || "admin") === section,
    );
  }

  // Update furniture price and currency
  updateFurniturePrice(
    furnitureId: string,
    price: number,
    currency: "xenocoins" | "cash",
  ): { success: boolean; error?: string } {
    const furniture = this.furniture.get(furnitureId);

    if (!furniture) {
      return { success: false, error: "Móvel não encontrado" };
    }

    // Update price and currency
    furniture.price = price;
    furniture.currency = currency;
    furniture.updated_at = new Date().toISOString();

    this.furniture.set(furnitureId, furniture);

    console.log(
      `✅ Updated furniture ${furnitureId} price: ${price} ${currency}`,
    );
    return { success: true };
  }

  // For testing
  testSystem(): boolean {
    try {
      const testId = "test_123";
      const testFurniture: CustomFurniture = {
        id: testId,
        name: "Test Item",
        glb_url: `memory://furniture/${testId}`,
        price: 0,
        currency: "xenocoins",
        category: "admin",
        is_active: true,
        created_by: "test",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.furniture.set(testId, testFurniture);

      const retrieved = this.furniture.get(testId);
      const allItems = Array.from(this.furniture.values());

      this.furniture.delete(testId);

      const success = retrieved !== undefined && allItems.length > 0;
      console.log(success ? "✅ System test passed" : "❌ System test failed");
      return success;
    } catch (error) {
      console.error("❌ System test error:", error);
      return false;
    }
  }
}

export const simpleFurnitureService = SimpleFurnitureService.getInstance();
