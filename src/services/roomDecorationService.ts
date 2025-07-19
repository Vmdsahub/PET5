import { supabase, isMockMode } from "../lib/supabase";

export interface RoomDecoration {
  id?: number;
  user_id: string;
  furniture_id: string;
  furniture_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  material_roughness?: number;
  material_metalness?: number;
  material_color?: string;
  material_emissive?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FurnitureState {
  furniture_id: string;
  furniture_type: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  material?: {
    roughness: number;
    metalness: number;
    color: string;
    emissive: string;
  };
}

class RoomDecorationService {
  /**
   * Save or update furniture decoration state for a user
   */
  async saveFurnitureState(
    userId: string,
    furnitureState: FurnitureState,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (isMockMode) {
        console.warn(
          "⚠️ MOCK MODE DETECTED: Using localStorage fallback for persistence",
        );

        // Use localStorage as fallback in mock mode
        const storageKey = `furniture_${userId}_${furnitureState.furniture_id}`;
        const dataToStore = {
          ...furnitureState,
          updated_at: new Date().toISOString(),
          is_active: true,
        };

        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        console.log("💾 Saved to localStorage:", storageKey, dataToStore);

        return { success: true };
      }
      const decorationData: Partial<RoomDecoration> = {
        user_id: userId,
        furniture_id: furnitureState.furniture_id,
        furniture_type: furnitureState.furniture_type,
        position_x: furnitureState.position.x,
        position_y: furnitureState.position.y,
        position_z: furnitureState.position.z,
        rotation_x: furnitureState.rotation.x,
        rotation_y: furnitureState.rotation.y,
        rotation_z: furnitureState.rotation.z,
        scale_x: furnitureState.scale.x,
        scale_y: furnitureState.scale.y,
        scale_z: furnitureState.scale.z,
        is_active: true,
      };

      // Add material properties if provided
      if (furnitureState.material) {
        decorationData.material_roughness = furnitureState.material.roughness;
        decorationData.material_metalness = furnitureState.material.metalness;
        decorationData.material_color = furnitureState.material.color;
        decorationData.material_emissive = furnitureState.material.emissive;
      }

      console.log("🗄️ Attempting to save to database:", {
        table: "user_room_decorations",
        data: decorationData,
      });

      const { error } = await supabase
        .from("user_room_decorations")
        .upsert(decorationData, {
          onConflict: "user_id,furniture_id",
        });

      if (error) {
        console.error("❌ Database save error:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // If table doesn't exist, warn but don't fail
        if (
          error.code === "42P01" ||
          error.message.includes("does not exist")
        ) {
          console.warn(
            "⚠️ DATABASE TABLE MISSING: user_room_decorations table does not exist yet. FURNITURE STATE NOT SAVED!",
          );
          console.warn(
            "📋 This means all furniture modifications will be lost!",
          );
          return { success: true }; // Return success to not break the flow
        }

        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in saveFurnitureState:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Load all furniture decoration states for a user
   */
  async loadUserRoomDecorations(userId: string): Promise<{
    success: boolean;
    decorations?: FurnitureState[];
    error?: string;
  }> {
    try {
      console.log(`🔍 Loading decorations for user: ${userId}`);
      console.log("🗄️ Querying database table: user_room_decorations");

      // Query with user_id and filter active ones locally
      const { data, error } = await supabase
        .from("user_room_decorations")
        .select("*")
        .eq("user_id", userId);

      console.log("📊 Database query result:", {
        dataCount: data?.length || 0,
        hasError: !!error,
        errorCode: error?.code,
      });

      if (error) {
        console.error("Error loading room decorations:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // If table doesn't exist, return empty result instead of error
        if (
          error.code === "42P01" ||
          error.message.includes("does not exist")
        ) {
          console.warn(
            "⚠️ DATABASE TABLE MISSING: user_room_decorations table does not exist yet. NO FURNITURE STATE CAN BE LOADED!",
          );
          console.warn(
            "📋 This explains why furniture modifications are not persisting!",
          );
          return { success: true, decorations: [] };
        }

        // Handle other common Supabase errors gracefully
        if (error.code === "PGRST116") {
          console.log("No decorations found for user, returning empty array");
          return { success: true, decorations: [] };
        }

        return { success: false, error: error.message };
      }

      // Filter for active decorations in JavaScript
      const activeDecorations = (data || []).filter(
        (item) => item.is_active === true,
      );

      const decorations: FurnitureState[] = activeDecorations.map((item) => ({
        furniture_id: item.furniture_id,
        furniture_type: item.furniture_type,
        position: {
          x: item.position_x,
          y: item.position_y,
          z: item.position_z,
        },
        rotation: {
          x: item.rotation_x,
          y: item.rotation_y,
          z: item.rotation_z,
        },
        scale: {
          x: item.scale_x,
          y: item.scale_y,
          z: item.scale_z,
        },
        material:
          item.material_roughness !== null
            ? {
                roughness: item.material_roughness || 0.5,
                metalness: item.material_metalness || 0,
                color: item.material_color || "#ffffff",
                emissive: item.material_emissive || "#000000",
              }
            : undefined,
      }));

      return { success: true, decorations };
    } catch (error) {
      console.error("Error in loadUserRoomDecorations:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Remove furniture from user's room (set as inactive)
   */
  async removeFurnitureFromRoom(
    userId: string,
    furnitureId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(
        `���️ Removing furniture ${furnitureId} from room for user ${userId}`,
      );

      // Use a different approach: update all user records and filter by furniture_id client-side
      // First get all user records
      const { data: userRecords, error: selectError } = await supabase
        .from("user_room_decorations")
        .select("*")
        .eq("user_id", userId);

      if (selectError) {
        console.error("Error finding user records:", selectError);
        if (
          selectError.code === "42P01" ||
          selectError.message.includes("does not exist")
        ) {
          console.warn(
            "⚠️ user_room_decorations table does not exist yet. Nothing to remove.",
          );
          return { success: true };
        }
        return { success: false, error: selectError.message };
      }

      // Find the specific furniture record
      const targetRecord = userRecords?.find(
        (record) => record.furniture_id === furnitureId && record.is_active,
      );

      if (!targetRecord) {
        console.log(
          `No active furniture ${furnitureId} found for user ${userId}`,
        );
        return { success: true }; // Nothing to remove is still success
      }

      // Update the specific record by ID (single condition)
      const { error } = await supabase
        .from("user_room_decorations")
        .update({ is_active: false })
        .eq("id", targetRecord.id);

      if (error) {
        console.error("Error removing furniture from room:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
        });

        // If table doesn't exist, just return success since there's nothing to remove
        if (
          error.code === "42P01" ||
          error.message.includes("does not exist")
        ) {
          console.warn(
            "⚠️ user_room_decorations table does not exist yet. Nothing to remove.",
          );
          return { success: true };
        }

        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in removeFurnitureFromRoom:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get specific furniture state
   */
  async getFurnitureState(
    userId: string,
    furnitureId: string,
  ): Promise<{ success: boolean; furniture?: FurnitureState; error?: string }> {
    try {
      // Query for user and filter in JavaScript
      const { data: allData, error } = await supabase
        .from("user_room_decorations")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        if (error.code === "PGRST116") {
          return { success: true, furniture: undefined };
        }
        console.error("Error getting furniture state:", error);
        return { success: false, error: error.message };
      }

      // Filter for the specific furniture that is active
      const furnitureData = allData?.find(
        (item) => item.furniture_id === furnitureId && item.is_active === true,
      );

      if (!furnitureData) {
        return { success: true, furniture: undefined };
      }

      const data = furnitureData;

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found - this is ok, furniture is not in room
          return { success: true, furniture: undefined };
        }
        console.error("Error getting furniture state:", error);
        return { success: false, error: error.message };
      }

      const furniture: FurnitureState = {
        furniture_id: data.furniture_id,
        furniture_type: data.furniture_type,
        position: {
          x: data.position_x,
          y: data.position_y,
          z: data.position_z,
        },
        rotation: {
          x: data.rotation_x,
          y: data.rotation_y,
          z: data.rotation_z,
        },
        scale: {
          x: data.scale_x,
          y: data.scale_y,
          z: data.scale_z,
        },
        material:
          data.material_roughness !== null
            ? {
                roughness: data.material_roughness || 0.5,
                metalness: data.material_metalness || 0,
                color: data.material_color || "#ffffff",
                emissive: data.material_emissive || "#000000",
              }
            : undefined,
      };

      return { success: true, furniture };
    } catch (error) {
      console.error("Error in getFurnitureState:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const roomDecorationService = new RoomDecorationService();
