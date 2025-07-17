import { supabase } from "../lib/supabase";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

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

export class FurnitureService {
  private static instance: FurnitureService;
  private gltfLoader: GLTFLoader;

  private constructor() {
    this.gltfLoader = new GLTFLoader();
  }

  public static getInstance(): FurnitureService {
    if (!FurnitureService.instance) {
      FurnitureService.instance = new FurnitureService();
    }
    return FurnitureService.instance;
  }

  /**
   * Upload GLB file and create custom furniture
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

      // Generate unique filename
      const fileExt = "glb";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `furniture/${fileName}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("furniture-glb")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return { success: false, error: "Erro ao fazer upload do arquivo" };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("furniture-glb").getPublicUrl(filePath);

      // Generate thumbnail (optional - can be implemented later)
      const thumbnailUrl = await this.generateThumbnail(file);

      // Create database record
      const { data: furniture, error: dbError } = await supabase
        .from("custom_furniture")
        .insert({
          name: furnitureData.name,
          description: furnitureData.description,
          glb_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          price: furnitureData.price || 10,
          currency: furnitureData.currency || "xenocoins",
          category: furnitureData.category || "admin",
          tags: furnitureData.tags || [],
          metadata: furnitureData.metadata || {},
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        // Cleanup uploaded file
        await supabase.storage.from("furniture-glb").remove([filePath]);
        return { success: false, error: "Erro ao salvar no banco de dados" };
      }

      return { success: true, furniture };
    } catch (error) {
      console.error("Upload furniture error:", error);
      return { success: false, error: "Erro interno do servidor" };
    }
  }

  /**
   * Get all custom furniture
   */
  async getAllCustomFurniture(): Promise<CustomFurniture[]> {
    try {
      console.log("Fetching custom furniture from database...");
      const { data, error } = await supabase
        .from("custom_furniture")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      console.log("Database response:", { data, error });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Get custom furniture error:", error);
      return [];
    }
  }

  /**
   * Get custom furniture by category
   */
  async getFurnitureByCategory(category: string): Promise<CustomFurniture[]> {
    try {
      const { data, error } = await supabase
        .from("custom_furniture")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Get furniture by category error:", error);
      return [];
    }
  }

  /**
   * Load GLB model from URL
   */
  async loadGLBModel(url: string): Promise<THREE.Group | null> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // Ensure model has proper shadows
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              // Ensure materials are compatible
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat) => {
                    if (mat instanceof THREE.Material) {
                      mat.needsUpdate = true;
                    }
                  });
                } else if (child.material instanceof THREE.Material) {
                  child.material.needsUpdate = true;
                }
              }
            }
          });

          // Center and scale model appropriately
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

          resolve(model);
        },
        (progress) => {
          // Loading progress can be handled here if needed
        },
        (error) => {
          console.error("GLTF loading error:", error);
          reject(error);
        },
      );
    });
  }

  /**
   * Update custom furniture
   */
  async updateFurniture(
    id: string,
    updates: Partial<FurnitureUploadData>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("custom_furniture")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Update furniture error:", error);
      return { success: false, error: "Erro ao atualizar móvel" };
    }
  }

  /**
   * Delete custom furniture
   */
  async deleteFurniture(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get furniture data to remove file
      const { data: furniture } = await supabase
        .from("custom_furniture")
        .select("glb_url")
        .eq("id", id)
        .single();

      // Delete from database
      const { error: dbError } = await supabase
        .from("custom_furniture")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      // Remove file from storage
      if (furniture?.glb_url) {
        const urlParts = furniture.glb_url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage
          .from("furniture-glb")
          .remove([`furniture/${fileName}`]);
      }

      return { success: true };
    } catch (error) {
      console.error("Delete furniture error:", error);
      return { success: false, error: "Erro ao deletar móvel" };
    }
  }

  /**
   * Purchase custom furniture
   */
  async purchaseCustomFurniture(
    furnitureId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; newBalance?: number }> {
    try {
      // Get furniture details
      const { data: furniture, error: furnitureError } = await supabase
        .from("custom_furniture")
        .select("price, currency, name")
        .eq("id", furnitureId)
        .eq("is_active", true)
        .single();

      if (furnitureError || !furniture) {
        return { success: false, message: "Móvel não encontrado" };
      }

      // Get user balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("xenocoins, cash")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        return { success: false, message: "Perfil do usuário não encontrado" };
      }

      const currentBalance =
        furniture.currency === "xenocoins" ? profile.xenocoins : profile.cash;

      if (currentBalance < furniture.price) {
        return {
          success: false,
          message: `Saldo insuficiente. Você precisa de ${furniture.price} ${furniture.currency}`,
        };
      }

      // Deduct currency
      const newBalance = currentBalance - furniture.price;
      const updateField =
        furniture.currency === "xenocoins" ? "xenocoins" : "cash";

      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ [updateField]: newBalance })
        .eq("id", userId);

      if (balanceError) throw balanceError;

      // Add to inventory (you may need to create a custom_furniture_inventory table)
      // For now, we'll add it as a special item type
      const { error: inventoryError } = await supabase
        .from("inventory")
        .insert({
          user_id: userId,
          item_id: furnitureId,
          quantity: 1,
          item_type: "custom_furniture", // Special type for custom furniture
        });

      if (inventoryError) {
        // Rollback balance change
        await supabase
          .from("profiles")
          .update({ [updateField]: currentBalance })
          .eq("id", userId);
        throw inventoryError;
      }

      return {
        success: true,
        message: `Móvel "${furniture.name}" comprado com sucesso!`,
        newBalance,
      };
    } catch (error) {
      console.error("Purchase custom furniture error:", error);
      return { success: false, message: "Erro ao comprar móvel" };
    }
  }

  /**
   * Generate thumbnail (placeholder implementation)
   */
  private async generateThumbnail(file: File): Promise<string | undefined> {
    // This is a placeholder. In a real implementation, you might:
    // 1. Load the GLB in a hidden THREE.js scene
    // 2. Render it to a canvas
    // 3. Convert to image and upload as thumbnail
    // For now, return undefined and handle thumbnails manually
    return undefined;
  }

  /**
   * Get user's custom furniture inventory
   */
  async getUserCustomFurniture(userId: string): Promise<CustomFurniture[]> {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select(
          `
          item_id,
          quantity,
          custom_furniture!inventory_item_id_fkey (*)
        `,
        )
        .eq("user_id", userId)
        .eq("item_type", "custom_furniture");

      if (error) throw error;
      return data?.map((item) => item.custom_furniture).filter(Boolean) || [];
    } catch (error) {
      console.error("Get user custom furniture error:", error);
      return [];
    }
  }
}

export const furnitureService = FurnitureService.getInstance();
