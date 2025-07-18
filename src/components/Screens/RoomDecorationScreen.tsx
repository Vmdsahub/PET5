import React, { useEffect, useRef, useState } from "react";
import {
  Globe,
  ShoppingCart,
  Package,
  Edit3,
  RotateCw,
  Move,
  ZoomIn,
  ZoomOut,
  Settings,
  Sun,
  Lightbulb,
  RefreshCcw,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { RoomExperience } from "../../lib/room3d/RoomExperience";
import { useAuthStore } from "../../store/authStore";
import { useGameStore } from "../../store/gameStore";
import { DraggableModal } from "../Layout/DraggableModal";
import { FurnitureCatalogModal } from "../Game/FurnitureCatalogModal";
import {
  roomDecorationService,
  FurnitureState,
} from "../../services/roomDecorationService";

interface RoomDecorationScreenProps {
  onNavigateBack: () => void;
}

interface NavigationItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

export const RoomDecorationScreen: React.FC<RoomDecorationScreenProps> = ({
  onNavigateBack,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<RoomExperience | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("room");
  const [showLightingPanel, setShowLightingPanel] = useState(false);
  const [showGeometryPanel, setShowGeometryPanel] = useState(false);
  const [lightSettings, setLightSettings] = useState<any>({});
  const [roomDimensions, setRoomDimensions] = useState<any>({});
  const [materialProperties, setMaterialProperties] = useState<any>({});
  const [showMaterialPanel, setShowMaterialPanel] = useState(false);
  const [showFurniturePanel, setShowFurniturePanel] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    objectId: string;
    x: number;
    y: number;
  } | null>(null);
  const [inventory, setInventory] = useState<
    Array<{
      id: string;
      name: string;
      type: string;
      thumbnail?: string;
      properties?: {
        scale?: { x: number; y: number; z: number };
        rotation?: { x: number; y: number; z: number };
        position?: { x: number; y: number; z: number };
        material?: {
          roughness: number;
          metalness: number;
          color: string;
          emissive: string;
        };
      } | null;
    }>
  >([]);
  const [isDraggingFromInventory, setIsDraggingFromInventory] = useState(false);
  const [lampStates, setLampStates] = useState<{ [key: string]: boolean }>({});
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [decorationsLoaded, setDecorationsLoaded] = useState(false);

  // Estados para controles de admin dos móveis
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(
    null,
  );
  const [currentScale, setCurrentScale] = useState({ x: 1, y: 1, z: 1 });
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0, z: 0 });
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0, z: 0 });
  const [currentMaterial, setCurrentMaterial] = useState({
    roughness: 0.5,
    metalness: 0,
    emissive: "#000000",
    color: "#ffffff",
  });

  const { user } = useAuthStore();
  const { xenocoins, cash, updateCurrency, addNotification } = useGameStore();

  // Function to save furniture state to database
  const saveFurnitureState = async (furnitureId: string) => {
    if (!user?.id || !experienceRef.current) return;

    // Small delay to ensure changes are applied in THREE.js before saving
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const furnitureType = experienceRef.current.getFurnitureType(furnitureId);
      const properties = experienceRef.current.getFurniture(furnitureId);

      if (!furnitureType || !properties) {
        console.warn(
          `Cannot save state for furniture ${furnitureId}: missing data`,
        );
        return;
      }

      const furnitureState: FurnitureState = {
        furniture_id: furnitureId,
        furniture_type: furnitureType,
        position: properties.position,
        rotation: properties.rotation,
        scale: properties.scale,
        material: properties.material,
      };

      console.log(`💾 Saving furniture state:`, furnitureState);

      const result = await roomDecorationService.saveFurnitureState(
        user.id,
        furnitureState,
      );

      if (result.success) {
        console.log(`✅ Furniture state saved for ${furnitureId}`);
      } else {
        console.error(`❌ Failed to save furniture state: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving furniture state:", error);
    }
  };

  // Load saved room decorations
  const loadSavedDecorations = async () => {
    if (!user?.id || !experienceRef.current || decorationsLoaded) return;

    try {
      console.log(`🏠 Loading saved decorations for user ${user.id}`);
      const result = await roomDecorationService.loadUserRoomDecorations(
        user.id,
      );

      if (result.success && result.decorations) {
        console.log(`📋 Found ${result.decorations.length} saved decorations`);

        for (const decoration of result.decorations) {
          console.log(`🪑 Restoring furniture: ${decoration.furniture_id}`);

          // Check if this furniture is in the inventory (if so, skip loading from DB)
          const isInInventory = inventory.some(
            (item) => item.id === decoration.furniture_id,
          );
          if (isInInventory) {
            console.log(
              `⏭️ Skipping ${decoration.furniture_id} - it's in inventory`,
            );
            continue;
          }

          // Add furniture to scene with saved state
          const success = await experienceRef.current.addFurnitureFromInventory(
            decoration.furniture_id,
            decoration.position,
            decoration.furniture_type,
          );

          if (success) {
            // Apply saved transformations and materials
            experienceRef.current.updateFurnitureScale(
              decoration.furniture_id,
              decoration.scale,
            );
            experienceRef.current.updateFurnitureRotation(
              decoration.furniture_id,
              decoration.rotation,
            );
            experienceRef.current.updateFurniturePosition(
              decoration.furniture_id,
              decoration.position,
            );

            if (decoration.material) {
              experienceRef.current.updateFurnitureMaterial(
                decoration.furniture_id,
                decoration.material,
              );
            }

            console.log(
              `✅ Successfully restored furniture: ${decoration.furniture_id}`,
            );
          } else {
            console.warn(
              `❌ Failed to restore furniture: ${decoration.furniture_id}`,
            );
          }
        }

        // Mark decorations as loaded to prevent multiple loads
        setDecorationsLoaded(true);
        console.log(`🏁 Decorations loading completed`);
      } else if (result.error) {
        console.error("Error loading decorations:", result.error);
      }
    } catch (error) {
      console.error("Error in loadSavedDecorations:", error);
    }
  };

  // Handle furniture purchase from catalog
  const handleFurniturePurchase = async (item: any): Promise<boolean> => {
    console.log(`📋 Purchasing furniture item:`, item);

    // Check if player has enough currency
    const currentAmount = item.currency === "xenocoins" ? xenocoins : cash;

    if (currentAmount < item.price) {
      addNotification({
        type: "error",
        title: "Saldo Insuficiente",
        message: `Você não tem ${item.currency === "xenocoins" ? "Xenocoins" : "Xenocash"} suficiente!`,
      });
      return false;
    }

    try {
      // Deduct currency using the game store
      const success = await updateCurrency(item.currency, -item.price);

      if (success) {
        const furnitureType = item.type || "furniture";
        console.log(`📦 Adding to inventory with type: ${furnitureType}`);

        // Add to inventory
        setInventory((prev) => [
          ...prev,
          {
            id: item.id,
            name: item.name,
            type: furnitureType,
            thumbnail: "", // Will be generated when placed
          },
        ]);

        addNotification({
          type: "success",
          title: "Compra Realizada!",
          message: `${item.name} foi adicionado ao seu inventário.`,
        });

        return true;
      } else {
        addNotification({
          type: "error",
          title: "Erro na Compra",
          message: "Erro ao processar compra. Tente novamente.",
        });
        return false;
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      addNotification({
        type: "error",
        title: "Erro na Compra",
        message: "Erro ao processar compra. Tente novamente.",
      });
      return false;
    }
  };

  // Load custom furniture on component mount

  const navigationItems: NavigationItem[] = [
    { id: "globe", icon: <Globe size={20} />, label: "Explorar" },
    { id: "catalog", icon: <ShoppingCart size={20} />, label: "Catálogo" },
    { id: "inventory", icon: <Package size={20} />, label: "Inventário" },
    {
      id: "edit",
      icon: <Edit3 size={20} />,
      label: "Editar",
      active: isEditMode,
    },
  ];

  useEffect(() => {
    if (canvasRef.current && !experienceRef.current) {
      experienceRef.current = new RoomExperience({
        targetElement: canvasRef.current,
        onObjectSelect: (objectId: string | null) => {
          setSelectedObject(objectId);
          setContextMenu(null); // Close context menu when selecting object
        },
        onRightClickFurniture: (
          objectId: string,
          position: { x: number; y: number },
        ) => {
          setContextMenu({
            show: true,
            objectId,
            x: position.x,
            y: position.y,
          });
        },
        editMode: isEditMode,
      });
    }

    return () => {
      if (experienceRef.current) {
        experienceRef.current.destroy();
        experienceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (experienceRef.current) {
      experienceRef.current.setEditMode(isEditMode);
      // Load initial light settings, room dimensions, and material properties for admin
      if (user?.isAdmin) {
        const lights = experienceRef.current.getAllLights();
        const dimensions = experienceRef.current.getRoomDimensions();
        const materials = experienceRef.current.getMaterialProperties();
        setLightSettings(lights);
        setRoomDimensions(dimensions);
        setMaterialProperties(materials);
      }

      // Load saved decorations when user changes or experience is ready
      if (user?.id) {
        // Reset decorations loaded flag when user changes
        if (!decorationsLoaded) {
          setTimeout(() => {
            loadSavedDecorations();
          }, 500); // Small delay to ensure scene is ready
        }
      } else {
        // Reset flag when user logs out
        setDecorationsLoaded(false);
      }
    }
  }, [isEditMode, user?.isAdmin, user?.id]);

  const handleNavigation = (id: string) => {
    switch (id) {
      case "globe":
        onNavigateBack();
        break;
      case "catalog":
        const newCatalogState = !showCatalogModal;
        setShowCatalogModal(newCatalogState);
        if (showInventoryModal) setShowInventoryModal(false);
        setActiveNav(newCatalogState ? "catalog" : "");
        break;
      case "inventory":
        const newInventoryState = !showInventoryModal;
        setShowInventoryModal(newInventoryState);
        if (showCatalogModal) setShowCatalogModal(false);
        setActiveNav(newInventoryState ? "inventory" : "");
        break;
      case "edit":
        setIsEditMode(!isEditMode);
        setActiveNav(isEditMode ? "" : "edit");
        break;
    }
  };

  const handleObjectTransform = (action: string) => {
    if (experienceRef.current && selectedObject) {
      switch (action) {
        case "rotate":
          experienceRef.current.rotateObject(selectedObject, Math.PI / 4);
          break;
        case "scale-up":
          experienceRef.current.scaleObject(selectedObject, 1.1);
          break;
        case "scale-down":
          experienceRef.current.scaleObject(selectedObject, 0.9);
          break;
      }
    }
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    const { objectId } = contextMenu;

    switch (action) {
      case "inspect":
        // TODO: Implement inspection modal
        console.log(`Inspecting ${objectId}`);
        break;
      case "admin-controls":
        // Set selected furniture for admin controls
        setSelectedFurniture(objectId);
        setIsEditMode(true);
        // Get current furniture properties
        if (experienceRef.current) {
          const furniture = experienceRef.current.getFurniture(objectId);
          if (furniture) {
            // Update admin controls with current properties
            setCurrentScale(furniture.scale || { x: 1, y: 1, z: 1 });
            setCurrentRotation(furniture.rotation || { x: 0, y: 0, z: 0 });
            setCurrentPosition(furniture.position || { x: 0, y: 0, z: 0 });
            // Update material properties if available
            if (furniture.material) {
              setCurrentMaterial({
                roughness: furniture.material.roughness || 0.5,
                metalness: furniture.material.metalness || 0,
                emissive: furniture.material.emissive || "#000000",
                color: furniture.material.color || "#ffffff",
              });
            }
          }
        }
        break;
      case "store":
        // Add to inventory and remove from scene
        const furnitureName = objectId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        // Get the correct furniture type to preserve it
        let furnitureType = "furniture";
        if (experienceRef.current) {
          const actualType = experienceRef.current.getFurnitureType(objectId);
          if (actualType) {
            furnitureType = actualType;
          }
        }

        // Get current furniture properties before storing
        let furnitureProperties = null;
        if (experienceRef.current) {
          furnitureProperties = experienceRef.current.getFurniture(objectId);
        }

        // Generate thumbnail for inventory
        let thumbnail = "";
        if (experienceRef.current) {
          thumbnail = experienceRef.current.generateThumbnail(objectId);
        }

        console.log(
          `📦 Storing furniture: ID=${objectId}, Type=${furnitureType}, Name=${furnitureName}`,
        );
        console.log(`💾 Furniture properties to store:`, furnitureProperties);

        setInventory((prev) => {
          // Check if item already exists in inventory to avoid duplicates
          const existsInInventory = prev.some((item) => item.id === objectId);

          if (existsInInventory) {
            console.log(
              `⚠️ Item ${objectId} already exists in inventory, not adding duplicate`,
            );
            return prev;
          }

          console.log(`➕ Adding ${objectId} to inventory`);
          return [
            ...prev,
            {
              id: objectId,
              name: furnitureName,
              type: furnitureType,
              thumbnail,
              // Store modified properties
              properties: furnitureProperties
                ? {
                    scale: furnitureProperties.scale,
                    rotation: furnitureProperties.rotation,
                    position: furnitureProperties.position,
                    material: furnitureProperties.material,
                  }
                : null,
            },
          ];
        });

        // Remove from 3D scene
        if (experienceRef.current) {
          experienceRef.current.removeFurniture(objectId);
        }

        // Remove from database if user is logged in
        if (user?.id) {
          roomDecorationService.removeFurnitureFromRoom(user.id, objectId);
        }

        // Remove lamp state if it's a lamp
        if (objectId.includes("lamp")) {
          setLampStates((prev) => {
            const newStates = { ...prev };
            delete newStates[objectId];
            return newStates;
          });
        }
        break;
      case "toggle-light":
        // Toggle lamp light
        if (objectId.includes("lamp")) {
          const isCurrentlyOn = lampStates[objectId] || false;
          const newState = !isCurrentlyOn;

          setLampStates((prev) => ({
            ...prev,
            [objectId]: newState,
          }));

          // Update 3D scene light
          if (experienceRef.current) {
            experienceRef.current.toggleFurnitureLight(objectId, newState);
          }
        }
        break;
    }

    setContextMenu(null);
  };

  const handleInventoryItemDrop = async (
    item: any,
    dropPosition: { x: number; y: number },
  ) => {
    // Convert screen position to 3D world position and place furniture
    if (experienceRef.current && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();

      // Check if drop position is within the 3D canvas area
      const isWithinCanvas =
        dropPosition.x >= canvasRect.left &&
        dropPosition.x <= canvasRect.right &&
        dropPosition.y >= canvasRect.top &&
        dropPosition.y <= canvasRect.bottom;

      if (isWithinCanvas) {
        // Convert screen coordinates to normalized device coordinates
        const x =
          ((dropPosition.x - canvasRect.left) / canvasRect.width) * 2 - 1;
        const y =
          -((dropPosition.y - canvasRect.top) / canvasRect.height) * 2 + 1;

        // Get 3D position using raycasting
        const worldPosition = experienceRef.current.getWorldPositionFromScreen(
          x,
          y,
        );

        if (worldPosition) {
          try {
            console.log(
              `🎯 Placing furniture from inventory: ID=${item.id}, Type=${item.type}, Name=${item.name}`,
            );
            const success =
              await experienceRef.current.addFurnitureFromInventory(
                item.id,
                {
                  x: worldPosition.x,
                  y: worldPosition.y,
                  z: worldPosition.z,
                },
                item.type,
              );

            if (success) {
              console.log(`✅ Successfully placed furniture: ${item.id}`);

              // Apply stored properties if they exist
              if (item.properties && experienceRef.current) {
                console.log(
                  `🔧 Applying stored properties to ${item.id}:`,
                  item.properties,
                );

                // Apply scale if stored
                if (item.properties.scale) {
                  experienceRef.current.updateFurnitureScale(
                    item.id,
                    item.properties.scale,
                  );
                }

                // Apply rotation if stored
                if (item.properties.rotation) {
                  experienceRef.current.updateFurnitureRotation(
                    item.id,
                    item.properties.rotation,
                  );
                }

                // Apply position (keep Y from world position, but apply stored X,Z if desired)
                if (item.properties.position) {
                  // Use new Y from drop position, but restore X,Z offsets if any
                  const adjustedPosition = {
                    x: worldPosition.x,
                    y: worldPosition.y, // Keep the floor level
                    z: worldPosition.z,
                  };
                  experienceRef.current.updateFurniturePosition(
                    item.id,
                    adjustedPosition,
                  );
                }

                // Apply material properties if stored
                if (item.properties.material) {
                  experienceRef.current.updateFurnitureMaterial(
                    item.id,
                    item.properties.material,
                  );
                }

                console.log(`✅ Applied stored properties to ${item.id}`);
              }

              // Save furniture state to database (with applied properties)
              if (user?.id) {
                // Small delay to ensure properties are applied before saving
                setTimeout(() => {
                  saveFurnitureState(item.id);
                }, 200);
              }

              // Remove from inventory
              setInventory((prev) =>
                prev.filter((invItem) => invItem.id !== item.id),
              );
            } else {
              console.warn(
                `❌ Failed to place furniture: ${item.id} with type: ${item.type}`,
              );
            }
          } catch (error) {
            console.error(`Error placing furniture ${item.id}:`, error);
          }
        }
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Canvas Container */}
      <div
        ref={canvasRef}
        className={`w-full h-full transition-all duration-200 ${
          isDraggingFromInventory
            ? "ring-4 ring-blue-400 ring-opacity-50 bg-blue-50/10"
            : ""
        }`}
        style={{ cursor: isEditMode ? "crosshair" : "default" }}
      />

      {/* Vertical Navigation Pill */}
      <motion.div
        className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 z-30"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
      >
        <div className="flex flex-col">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`
                relative p-3 transition-all duration-200 flex items-center justify-center
                ${
                  index === 0
                    ? "rounded-t-2xl"
                    : index === navigationItems.length - 1
                      ? "rounded-b-2xl"
                      : ""
                }
                ${
                  item.active || activeNav === item.id
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={item.label}
            >
              {item.icon}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Edit Mode UI */}
      {isEditMode && (
        <motion.div
          className="fixed top-20 right-4 bg-yellow-50/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-4 border-yellow-200/50 z-40"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          style={{
            background: "linear-gradient(145deg, #fefce8, #fef3c7)",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Edit3 size={24} className="text-amber-600" />
            <span className="font-bold text-amber-800 text-lg">
              🏠 Modo Decoração
            </span>
          </div>

          {selectedObject ? (
            <div className="space-y-4">
              <div className="bg-white/60 rounded-2xl p-3 border-2 border-yellow-200">
                <p className="text-sm text-amber-700 mb-1 font-medium">
                  🪑 Móvel Selecionado:
                </p>
                <p className="font-bold text-amber-900 capitalize">
                  {selectedObject.replace(/-/g, " ")}
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={() => handleObjectTransform("rotate")}
                  className="p-3 bg-gradient-to-br from-purple-400 to-purple-500 text-white rounded-xl border-2 border-purple-300 font-medium shadow-lg"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  title="Girar"
                  style={{ boxShadow: "0 6px 12px rgba(168, 85, 247, 0.4)" }}
                >
                  <RotateCw size={18} />
                </motion.button>

                <motion.button
                  onClick={() => handleObjectTransform("scale-up")}
                  className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-xl border-2 border-emerald-300 font-medium shadow-lg"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  title="Aumentar"
                  style={{ boxShadow: "0 6px 12px rgba(16, 185, 129, 0.4)" }}
                >
                  <ZoomIn size={18} />
                </motion.button>

                <motion.button
                  onClick={() => handleObjectTransform("scale-down")}
                  className="p-3 bg-gradient-to-br from-red-400 to-red-500 text-white rounded-xl border-2 border-red-300 font-medium shadow-lg"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  title="Diminuir"
                  style={{ boxShadow: "0 6px 12px rgba(239, 68, 68, 0.4)" }}
                >
                  <ZoomOut size={18} />
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="bg-white/60 rounded-2xl p-4 border-2 border-yellow-200 text-center">
              <p className="text-amber-700 font-medium">
                🎯 Clique em um móvel para decorar!
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Admin Lighting Panel */}
      {user?.isAdmin && (
        <motion.div
          className="fixed top-20 right-4 bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-4 border-slate-700/50 z-50 max-h-[80vh] overflow-y-auto"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          style={{
            background: "linear-gradient(145deg, #1e293b, #334155)",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings size={20} className="text-blue-400" />
            <span className="text-white font-bold">🔧 Admin Controls</span>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setShowLightingPanel(!showLightingPanel)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                showLightingPanel
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              💡 Iluminação
            </button>
            <button
              onClick={() => setShowGeometryPanel(!showGeometryPanel)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                showGeometryPanel
                  ? "bg-purple-500 text-white shadow-lg"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              🏗️ Geometria
            </button>
            <button
              onClick={() => setShowMaterialPanel(!showMaterialPanel)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                showMaterialPanel
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              🎨 Materiais
            </button>
            {selectedFurniture && (
              <button
                onClick={() => setShowFurniturePanel(!showFurniturePanel)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  showFurniturePanel
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                🪑 M��vel: {selectedFurniture.replace(/-/g, " ")}
              </button>
            )}
          </div>

          {showLightingPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 w-80"
            >
              {/* Reset Button */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <button
                  onClick={() => {
                    if (experienceRef.current) {
                      experienceRef.current.resetLightingToDefaults();
                      const lights = experienceRef.current.getAllLights();
                      setLightSettings(lights);
                    }
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={16} />
                  Restaurar Padrões
                </button>
              </div>

              {/* Time of Day Control */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Sun size={16} className="text-yellow-400" />
                  <span className="text-white font-medium">Time of Day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  defaultValue="12"
                  onChange={(e) => {
                    if (experienceRef.current) {
                      experienceRef.current.setTimeOfDay(
                        parseInt(e.target.value),
                      );
                    }
                  }}
                  className="w-full slider"
                />
              </div>

              {/* Light Controls */}
              {Object.entries(lightSettings).map(
                ([lightName, settings]: [string, any]) => (
                  <div
                    key={lightName}
                    className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={16} className="text-yellow-400" />
                      <span className="text-white font-medium capitalize">
                        {lightName} Light
                      </span>
                    </div>

                    {/* Intensity Control */}
                    <div className="mb-3">
                      <label className="text-slate-300 text-xs block mb-1">
                        Intensity
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        defaultValue={settings.intensity}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateLightIntensity(
                              lightName,
                              parseFloat(e.target.value),
                            );
                          }
                        }}
                        className="w-full slider"
                      />
                    </div>

                    {/* Color Control */}
                    <div className="mb-3">
                      <label className="text-slate-300 text-xs block mb-1">
                        Color
                      </label>
                      <input
                        type="color"
                        defaultValue={settings.color}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateLightColor(
                              lightName,
                              e.target.value,
                            );
                          }
                        }}
                        className="w-full h-8 rounded border border-slate-600 bg-slate-700"
                      />
                    </div>

                    {/* Shadow Toggle */}
                    <div>
                      <label className="flex items-center gap-2 text-slate-300 text-xs">
                        <input
                          type="checkbox"
                          defaultChecked={settings.castShadow}
                          onChange={(e) => {
                            if (experienceRef.current) {
                              experienceRef.current.updateShadowSettings(
                                lightName,
                                {
                                  enabled: e.target.checked,
                                },
                              );
                            }
                          }}
                          className="rounded"
                        />
                        Cast Shadows
                      </label>
                    </div>
                  </div>
                ),
              )}
            </motion.div>
          )}

          {showGeometryPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 w-80"
            >
              {/* Reset Button */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <button
                  onClick={() => {
                    if (experienceRef.current) {
                      experienceRef.current.resetGeometryToDefaults();
                      const dimensions =
                        experienceRef.current.getRoomDimensions();
                      setRoomDimensions(dimensions);
                    }
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={16} />
                  Restaurar Padrões
                </button>
              </div>

              {/* Floor Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-green-400" />
                  <span className="text-white font-medium">🟫 Piso</span>
                </div>

                <div className="space-y-3">
                  {/* Floor Width */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Largura
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        defaultValue={roomDimensions.floorWidth || 20}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateFloorWidth(
                              parseInt(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              floorWidth: parseInt(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.floorWidth || 20}m
                      </span>
                    </div>
                  </div>

                  {/* Floor Depth */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Profundidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        defaultValue={roomDimensions.floorDepth || 20}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateFloorDepth(
                              parseInt(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              floorDepth: parseInt(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.floorDepth || 20}m
                      </span>
                    </div>
                  </div>

                  {/* Floor Thickness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Espessura
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        defaultValue={roomDimensions.floorThickness || 0.2}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateFloorThickness(
                              parseFloat(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              floorThickness: parseFloat(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {(roomDimensions.floorThickness || 0.2).toFixed(2)}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ceiling Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-blue-400" />
                  <span className="text-white font-medium">⬜ Teto</span>
                </div>

                <div className="space-y-3">
                  {/* Ceiling Width */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Largura
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        defaultValue={roomDimensions.ceilingWidth || 20}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateCeilingWidth(
                              parseInt(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              ceilingWidth: parseInt(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.ceilingWidth || 20}m
                      </span>
                    </div>
                  </div>

                  {/* Ceiling Depth */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Profundidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        defaultValue={roomDimensions.ceilingDepth || 20}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateCeilingDepth(
                              parseInt(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              ceilingDepth: parseInt(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.ceilingDepth || 20}m
                      </span>
                    </div>
                  </div>

                  {/* Ceiling Thickness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Espessura
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        defaultValue={roomDimensions.ceilingThickness || 0.2}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateCeilingThickness(
                              parseFloat(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              ceilingThickness: parseFloat(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {(roomDimensions.ceilingThickness || 0.2).toFixed(2)}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Wall Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-orange-400" />
                  <span className="text-white font-medium">
                    🧱 Parede Traseira
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Back Wall Width */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Largura
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        defaultValue={roomDimensions.backWallWidth || 20}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateBackWallWidth(
                              parseInt(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              backWallWidth: parseInt(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.backWallWidth || 20}m
                      </span>
                    </div>
                  </div>

                  {/* Back Wall Height */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Altura
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="3"
                        max="20"
                        step="0.5"
                        defaultValue={roomDimensions.backWallHeight || 10}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateBackWallHeight(
                              parseFloat(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              backWallHeight: parseFloat(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.backWallHeight || 10}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Left Wall Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-red-400" />
                  <span className="text-white font-medium">
                    🧱 Parede Esquerda
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Left Wall Depth */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Profundidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        defaultValue={roomDimensions.leftWallDepth || 20}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateLeftWallDepth(
                              parseInt(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              leftWallDepth: parseInt(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.leftWallDepth || 20}m
                      </span>
                    </div>
                  </div>

                  {/* Left Wall Height */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Altura
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="3"
                        max="20"
                        step="0.5"
                        defaultValue={roomDimensions.leftWallHeight || 10}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateLeftWallHeight(
                              parseFloat(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              leftWallHeight: parseFloat(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.leftWallHeight || 10}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Wall Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-yellow-400" />
                  <span className="text-white font-medium">
                    🧱 Parede Direita
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Right Wall Depth */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Profundidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        defaultValue={roomDimensions.rightWallDepth || 20}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateRightWallDepth(
                              parseInt(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              rightWallDepth: parseInt(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.rightWallDepth || 20}m
                      </span>
                    </div>
                  </div>

                  {/* Right Wall Height */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Altura
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="3"
                        max="20"
                        step="0.5"
                        defaultValue={roomDimensions.rightWallHeight || 10}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateRightWallHeight(
                              parseFloat(e.target.value),
                            );
                            setRoomDimensions((prev) => ({
                              ...prev,
                              rightWallHeight: parseFloat(e.target.value),
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {roomDimensions.rightWallHeight || 10}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wall Thickness Control (Global) */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-purple-400" />
                  <span className="text-white font-medium">
                    📏 Espessura das Paredes
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    defaultValue={roomDimensions.wallThickness || 0.2}
                    onChange={(e) => {
                      if (experienceRef.current) {
                        experienceRef.current.updateWallThickness(
                          parseFloat(e.target.value),
                        );
                        setRoomDimensions((prev) => ({
                          ...prev,
                          wallThickness: parseFloat(e.target.value),
                        }));
                      }
                    }}
                    className="flex-1 slider"
                  />
                  <span className="text-slate-300 text-sm min-w-[3rem]">
                    {(roomDimensions.wallThickness || 0.2).toFixed(2)}m
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {showMaterialPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 w-80"
            >
              {/* Reset Button */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <button
                  onClick={() => {
                    if (experienceRef.current) {
                      experienceRef.current.resetMaterialsToDefaults();
                      const materials =
                        experienceRef.current.getMaterialProperties();
                      setMaterialProperties(materials);
                      // Force re-render of controls with default values
                      window.location.reload(); // Quick solution for demo - in production use state management
                    }
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={16} />
                  Restaurar Padrões
                </button>
              </div>

              {/* Floor Material Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-amber-400" />
                  <span className="text-white font-medium">🟫 Piso</span>
                </div>

                <div className="space-y-3">
                  {/* Floor Color */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Cor
                    </label>
                    <input
                      type="color"
                      defaultValue={
                        materialProperties.floor?.color || "#8B7355"
                      }
                      onChange={(e) => {
                        if (experienceRef.current) {
                          experienceRef.current.updateFloorMaterial({
                            color: e.target.value,
                          });
                          setMaterialProperties((prev) => ({
                            ...prev,
                            floor: { ...prev.floor, color: e.target.value },
                          }));
                        }
                      }}
                      className="w-full h-8 rounded border border-slate-600 bg-slate-700"
                    />
                  </div>

                  {/* Floor Roughness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Rugosidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        defaultValue={
                          materialProperties.floor?.roughness || 0.8
                        }
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateFloorMaterial({
                              roughness: parseFloat(e.target.value),
                            });
                            setMaterialProperties((prev) => ({
                              ...prev,
                              floor: {
                                ...prev.floor,
                                roughness: parseFloat(e.target.value),
                              },
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {(materialProperties.floor?.roughness || 0.8).toFixed(
                          2,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Floor Metalness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Metalicidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        defaultValue={
                          materialProperties.floor?.metalness || 0.1
                        }
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateFloorMaterial({
                              metalness: parseFloat(e.target.value),
                            });
                            setMaterialProperties((prev) => ({
                              ...prev,
                              floor: {
                                ...prev.floor,
                                metalness: parseFloat(e.target.value),
                              },
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {(materialProperties.floor?.metalness || 0.1).toFixed(
                          2,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wall Material Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-blue-400" />
                  <span className="text-white font-medium">🧱 Paredes</span>
                </div>

                <div className="space-y-3">
                  {/* Wall Color */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Cor
                    </label>
                    <input
                      type="color"
                      defaultValue={materialProperties.wall?.color || "#F5F5F0"}
                      onChange={(e) => {
                        if (experienceRef.current) {
                          experienceRef.current.updateWallMaterial({
                            color: e.target.value,
                          });
                          setMaterialProperties((prev) => ({
                            ...prev,
                            wall: { ...prev.wall, color: e.target.value },
                          }));
                        }
                      }}
                      className="w-full h-8 rounded border border-slate-600 bg-slate-700"
                    />
                  </div>

                  {/* Wall Roughness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Rugosidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        defaultValue={materialProperties.wall?.roughness || 0.9}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateWallMaterial({
                              roughness: parseFloat(e.target.value),
                            });
                            setMaterialProperties((prev) => ({
                              ...prev,
                              wall: {
                                ...prev.wall,
                                roughness: parseFloat(e.target.value),
                              },
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {(materialProperties.wall?.roughness || 0.9).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Wall Metalness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Metalicidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        defaultValue={
                          materialProperties.wall?.metalness || 0.05
                        }
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateWallMaterial({
                              metalness: parseFloat(e.target.value),
                            });
                            setMaterialProperties((prev) => ({
                              ...prev,
                              wall: {
                                ...prev.wall,
                                metalness: parseFloat(e.target.value),
                              },
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {(materialProperties.wall?.metalness || 0.05).toFixed(
                          2,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ceiling Material Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-purple-400" />
                  <span className="text-white font-medium">⬜ Teto</span>
                </div>

                <div className="space-y-3">
                  {/* Ceiling Color */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Cor
                    </label>
                    <input
                      type="color"
                      defaultValue={
                        materialProperties.ceiling?.color || "#FFFFFF"
                      }
                      onChange={(e) => {
                        if (experienceRef.current) {
                          experienceRef.current.updateCeilingMaterial({
                            color: e.target.value,
                          });
                          setMaterialProperties((prev) => ({
                            ...prev,
                            ceiling: { ...prev.ceiling, color: e.target.value },
                          }));
                        }
                      }}
                      className="w-full h-8 rounded border border-slate-600 bg-slate-700"
                    />
                  </div>

                  {/* Ceiling Roughness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Rugosidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        defaultValue={
                          materialProperties.ceiling?.roughness || 0.9
                        }
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateCeilingMaterial({
                              roughness: parseFloat(e.target.value),
                            });
                            setMaterialProperties((prev) => ({
                              ...prev,
                              ceiling: {
                                ...prev.ceiling,
                                roughness: parseFloat(e.target.value),
                              },
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {(materialProperties.ceiling?.roughness || 0.9).toFixed(
                          2,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Ceiling Metalness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Metalicidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        defaultValue={
                          materialProperties.ceiling?.metalness || 0.02
                        }
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateCeilingMaterial({
                              metalness: parseFloat(e.target.value),
                            });
                            setMaterialProperties((prev) => ({
                              ...prev,
                              ceiling: {
                                ...prev.ceiling,
                                metalness: parseFloat(e.target.value),
                              },
                            }));
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {(
                          materialProperties.ceiling?.metalness || 0.02
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Furniture Controls Panel */}
          {showFurniturePanel && selectedFurniture && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 w-80"
            >
              {/* Header */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings size={16} className="text-orange-400" />
                    <span className="text-white font-medium">
                      🪑 {selectedFurniture.replace(/-/g, " ")}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFurniture(null);
                      setShowFurniturePanel(false);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scale Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <ZoomIn size={16} className="text-green-400" />
                  <span className="text-white font-medium">Tamanho</span>
                </div>
                <div className="space-y-3">
                  {["x", "y", "z"].map((axis) => (
                    <div key={axis}>
                      <label className="text-slate-300 text-xs block mb-1">
                        Escala {axis.toUpperCase()}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={
                            currentScale[axis as keyof typeof currentScale]
                          }
                          onChange={(e) => {
                            const newScale = {
                              ...currentScale,
                              [axis]: parseFloat(e.target.value),
                            };
                            setCurrentScale(newScale);
                            if (experienceRef.current && selectedFurniture) {
                              experienceRef.current.updateFurnitureScale(
                                selectedFurniture,
                                newScale,
                              );
                              // Auto-save the change
                              saveFurnitureState(selectedFurniture);
                            }
                          }}
                          className="flex-1 slider"
                        />
                        <span className="text-slate-300 text-sm min-w-[3rem]">
                          {currentScale[
                            axis as keyof typeof currentScale
                          ].toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rotation Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <RotateCw size={16} className="text-purple-400" />
                  <span className="text-white font-medium">Rotação</span>
                </div>
                <div className="space-y-3">
                  {["x", "y", "z"].map((axis) => (
                    <div key={axis}>
                      <label className="text-slate-300 text-xs block mb-1">
                        Rotação {axis.toUpperCase()}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="5"
                          value={
                            currentRotation[
                              axis as keyof typeof currentRotation
                            ]
                          }
                          onChange={(e) => {
                            const newRotation = {
                              ...currentRotation,
                              [axis]: parseFloat(e.target.value),
                            };
                            setCurrentRotation(newRotation);
                            if (experienceRef.current && selectedFurniture) {
                              experienceRef.current.updateFurnitureRotation(
                                selectedFurniture,
                                newRotation,
                              );
                              // Auto-save the change
                              saveFurnitureState(selectedFurniture);
                            }
                          }}
                          className="flex-1 slider"
                        />
                        <span className="text-slate-300 text-sm min-w-[3rem]">
                          {
                            currentRotation[
                              axis as keyof typeof currentRotation
                            ]
                          }
                          °
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Position Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Move size={16} className="text-blue-400" />
                  <span className="text-white font-medium">Posição</span>
                </div>
                <div className="space-y-3">
                  {["x", "y", "z"].map((axis) => (
                    <div key={axis}>
                      <label className="text-slate-300 text-xs block mb-1">
                        Posição {axis.toUpperCase()}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="0.1"
                          value={
                            currentPosition[
                              axis as keyof typeof currentPosition
                            ]
                          }
                          onChange={(e) => {
                            const newPosition = {
                              ...currentPosition,
                              [axis]: parseFloat(e.target.value),
                            };
                            setCurrentPosition(newPosition);
                            if (experienceRef.current && selectedFurniture) {
                              experienceRef.current.updateFurniturePosition(
                                selectedFurniture,
                                newPosition,
                              );
                              // Auto-save the change
                              saveFurnitureState(selectedFurniture);
                            }
                          }}
                          className="flex-1 slider"
                        />
                        <span className="text-slate-300 text-sm min-w-[3rem]">
                          {currentPosition[
                            axis as keyof typeof currentPosition
                          ].toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Material Controls */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-yellow-400" />
                  <span className="text-white font-medium">Material</span>
                </div>
                <div className="space-y-3">
                  {/* Roughness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Rugosidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={currentMaterial.roughness}
                        onChange={(e) => {
                          const newMaterial = {
                            ...currentMaterial,
                            roughness: parseFloat(e.target.value),
                          };
                          setCurrentMaterial(newMaterial);
                          if (experienceRef.current && selectedFurniture) {
                            experienceRef.current.updateFurnitureMaterial(
                              selectedFurniture,
                              { roughness: parseFloat(e.target.value) },
                            );
                            // Auto-save the change
                            saveFurnitureState(selectedFurniture);
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {currentMaterial.roughness.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Metalness */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Metalicidade
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={currentMaterial.metalness}
                        onChange={(e) => {
                          const newMaterial = {
                            ...currentMaterial,
                            metalness: parseFloat(e.target.value),
                          };
                          setCurrentMaterial(newMaterial);
                          if (experienceRef.current && selectedFurniture) {
                            experienceRef.current.updateFurnitureMaterial(
                              selectedFurniture,
                              { metalness: parseFloat(e.target.value) },
                            );
                            // Auto-save the change
                            saveFurnitureState(selectedFurniture);
                          }
                        }}
                        className="flex-1 slider"
                      />
                      <span className="text-slate-300 text-sm min-w-[3rem]">
                        {currentMaterial.metalness.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Cor
                    </label>
                    <input
                      type="color"
                      value={currentMaterial.color}
                      onChange={(e) => {
                        const newMaterial = {
                          ...currentMaterial,
                          color: e.target.value,
                        };
                        setCurrentMaterial(newMaterial);
                        if (experienceRef.current && selectedFurniture) {
                          experienceRef.current.updateFurnitureMaterial(
                            selectedFurniture,
                            { color: e.target.value },
                          );
                          // Auto-save the change
                          saveFurnitureState(selectedFurniture);
                        }
                      }}
                      className="w-full h-8 rounded border border-slate-600 bg-slate-700"
                    />
                  </div>

                  {/* Emissive */}
                  <div>
                    <label className="text-slate-300 text-xs block mb-1">
                      Emissão
                    </label>
                    <input
                      type="color"
                      value={currentMaterial.emissive}
                      onChange={(e) => {
                        const newMaterial = {
                          ...currentMaterial,
                          emissive: e.target.value,
                        };
                        setCurrentMaterial(newMaterial);
                        if (experienceRef.current && selectedFurniture) {
                          experienceRef.current.updateFurnitureMaterial(
                            selectedFurniture,
                            { emissive: e.target.value },
                          );
                          // Auto-save the change
                          saveFurnitureState(selectedFurniture);
                        }
                      }}
                      className="w-full h-8 rounded border border-slate-600 bg-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <button
                  onClick={() => {
                    if (experienceRef.current && selectedFurniture) {
                      experienceRef.current.resetFurnitureToDefaults(
                        selectedFurniture,
                      );
                      // Reset local state
                      setCurrentScale({ x: 1, y: 1, z: 1 });
                      setCurrentRotation({ x: 0, y: 0, z: 0 });
                      setCurrentPosition({ x: 0, y: 0, z: 0 });
                      setCurrentMaterial({
                        roughness: 0.5,
                        metalness: 0,
                        emissive: "#000000",
                        color: "#ffffff",
                      });
                    }
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={16} />
                  Restaurar Padrões
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Furniture Catalog Modal */}
      <FurnitureCatalogModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        userXenocoins={xenocoins}
        userXenocash={cash}
        isAdmin={user?.isAdmin || false}
        onPurchaseItem={handleFurniturePurchase}
        onNotification={addNotification}
      />

      {/* Inventory Modal */}
      <DraggableModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        title="Inventário"
        modalId="inventory"
        width={500}
        height={600}
        zIndex={100}
      >
        <div className="p-6 h-full bg-white">
          {/* Inventory Grid */}
          <div className="grid grid-cols-4 gap-4 h-full">
            {/* Inventory items */}
            {inventory.map((item) => (
              <motion.div
                key={item.id}
                className="aspect-square border border-gray-300 rounded-lg flex flex-col items-center justify-center p-2 cursor-move bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                draggable
                onDragStart={() => {
                  setIsDraggingFromInventory(true);
                }}
                onDragEnd={async (e, info) => {
                  setIsDraggingFromInventory(false);
                  // Use clientX/Y for global screen position
                  const dropX = e.clientX;
                  const dropY = e.clientY;
                  await handleInventoryItemDrop(item, { x: dropX, y: dropY });
                }}
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <Package size={20} className="text-blue-500 mb-1" />
                )}
                <span className="text-xs text-center font-medium text-gray-700 leading-tight absolute bottom-1 left-1 right-1 bg-white/80 rounded px-1">
                  {item.name}
                </span>
              </motion.div>
            ))}

            {/* Empty inventory slots */}
            {Array.from({ length: Math.max(0, 20 - inventory.length) }).map(
              (_, index) => (
                <div
                  key={`empty-${index}`}
                  className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-gray-300 transition-colors"
                >
                  <Package size={24} className="opacity-50" />
                </div>
              ),
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              🖱️ Clique com o botão direito nos móveis para guardá-los aqui
              <br />
              🎨 Arraste do inventário para o quarto para colocar móveis
            </p>
          </div>
        </div>
      </DraggableModal>

      {/* Context Menu */}
      {contextMenu?.show && (
        <>
          {/* Overlay to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />

          {/* Context Menu */}
          <motion.div
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[150px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1 }}
          >
            <button
              onClick={() => handleContextMenuAction("inspect")}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-gray-700 font-medium"
            >
              🔍 Inspecionar
            </button>

            {/* Show light toggle for lamps */}
            {contextMenu.objectId.includes("lamp") && (
              <button
                onClick={() => handleContextMenuAction("toggle-light")}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-gray-700 font-medium"
              >
                {lampStates[contextMenu.objectId] ? "💡 Desligar" : "🔦 Ligar"}
              </button>
            )}

            {/* Admin Controls Option */}
            {user?.isAdmin && (
              <button
                onClick={() => handleContextMenuAction("admin-controls")}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-purple-700 font-medium border-t border-gray-200"
              >
                ⚙️ Controles de Admin
              </button>
            )}

            <button
              onClick={() => handleContextMenuAction("store")}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-gray-700 font-medium"
            >
              📦 Guardar
            </button>
          </motion.div>
        </>
      )}

      {/* Drag and Drop Indicator */}
      {isDraggingFromInventory && (
        <motion.div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-6 py-4 rounded-2xl text-lg font-bold z-50 pointer-events-none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          🎯 Solte aqui para posicionar o móvel!
        </motion.div>
      )}

      {/* Instructions */}
      {!isEditMode && !isDraggingFromInventory && (
        <motion.div
          className="fixed bottom-20 left-4 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-6 py-3 rounded-2xl text-sm font-medium border-2 border-yellow-200 z-40 max-w-xs"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1, type: "spring", bounce: 0.3 }}
          style={{
            boxShadow:
              "0 8px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          🖱�� Use o mouse para navegar pela casa • 🎨 Clique em Editar para
          decorar
        </motion.div>
      )}
    </div>
  );
};
