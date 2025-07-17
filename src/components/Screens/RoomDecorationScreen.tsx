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
  Coins,
  DollarSign,
  Upload,
  Plus,
  X,
  Trash2,
  Crown,
} from "lucide-react";
import { motion } from "framer-motion";
import { RoomExperience } from "../../lib/room3d/RoomExperience";
import { useAuthStore } from "../../store/authStore";
import { useGameStore } from "../../store/gameStore";
import { DraggableModal } from "../Layout/DraggableModal";
import {
  furnitureService,
  CustomFurniture,
} from "../../services/furnitureService";

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
    }>
  >([]);
  const [isDraggingFromInventory, setIsDraggingFromInventory] = useState(false);
  const [lampStates, setLampStates] = useState<{ [key: string]: boolean }>({});
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogTab, setCatalogTab] = useState<"store" | "admin">("store");

  // GLB Upload state
  const [customFurniture, setCustomFurniture] = useState<CustomFurniture[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: "",
    description: "",
    price: 10,
    currency: "xenocoins" as "xenocoins" | "cash",
    category: "admin" as "admin" | "premium" | "seasonal",
    tags: [] as string[],
  });
  const [isUploading, setIsUploading] = useState(false);

  const { user } = useAuthStore();
  const { xenocoins, cash, updateCurrency, addNotification } = useGameStore();

  // Load custom furniture on component mount
  useEffect(() => {
    loadCustomFurniture();
  }, []);

  // Reload custom furniture when switching to admin tab
  useEffect(() => {
    if (catalogTab === "admin") {
      console.log("Admin tab selected, reloading custom furniture...");
      loadCustomFurniture();
    }
  }, [catalogTab]);

  const loadCustomFurniture = async () => {
    try {
      console.log("Loading custom furniture...");
      const furniture = await furnitureService.getAllCustomFurniture();
      console.log("Loaded custom furniture:", furniture);
      setCustomFurniture(furniture);
    } catch (error) {
      console.error("Error loading custom furniture:", error);
    }
  };

  const handleFurnitureUpload = async () => {
    if (!uploadFile || !uploadData.name.trim()) {
      addNotification({
        type: "error",
        title: "Erro",
        message: "Arquivo GLB e nome são obrigatórios.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await furnitureService.uploadFurniture(
        uploadFile,
        uploadData,
      );

      if (result.success) {
        addNotification({
          type: "success",
          title: "Sucesso!",
          message: "Móvel adicionado ao catálogo com sucesso.",
        });
        setShowUploadModal(false);
        resetUploadData();
        loadCustomFurniture(); // Reload furniture list
      } else {
        addNotification({
          type: "error",
          title: "Erro",
          message: result.error || "Erro ao fazer upload do móvel.",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      addNotification({
        type: "error",
        title: "Erro",
        message: "Erro interno do servidor.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFurniture = async (furnitureId: string) => {
    if (confirm("Tem certeza que deseja deletar este móvel?")) {
      try {
        const result = await furnitureService.deleteFurniture(furnitureId);
        if (result.success) {
          addNotification({
            type: "success",
            title: "Sucesso!",
            message: "Móvel deletado com sucesso.",
          });
          loadCustomFurniture();
        } else {
          addNotification({
            type: "error",
            title: "Erro",
            message: result.error || "Erro ao deletar móvel.",
          });
        }
      } catch (error) {
        console.error("Delete error:", error);
        addNotification({
          type: "error",
          title: "Erro",
          message: "Erro ao deletar móvel.",
        });
      }
    }
  };

  const resetUploadData = () => {
    setUploadFile(null);
    setUploadData({
      name: "",
      description: "",
      price: 10,
      currency: "xenocoins",
      category: "admin",
      tags: [],
    });
  };

  // Function to generate item thumbnails
  const getItemThumbnail = (itemId: string) => {
    const thumbnails = {
      "premium-sofa":
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNmOGZhZmMiLz48cmVjdCB4PSIyMCIgeT0iNjAiIHdpZHRoPSI4OCIgaGVpZ2h0PSIzNSIgcng9IjUiIGZpbGw9IiM0QTVEMjMiLz48cmVjdCB4PSIyMCIgeT0iNDUiIHdpZHRoPSI4OCIgaGVpZ2h0PSIzMCIgcng9IjMiIGZpbGw9IiM0QTVEMjMiLz48cmVjdCB4PSIxNSIgeT0iNDAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IiM0QTVEMjMiLz48cmVjdCB4PSIxMDMiIHk9IjQwIiB3aWR0aD0iMTAiIGhlaWdodD0iNDAiIHJ4PSI1IiBmaWxsPSIjNEE1RDIzIi8+PHJlY3QgeD0iMjUiIHk9IjUwIiB3aWR0aD0iMjAiIGhlaWdodD0iMTUiIHJ4PSIzIiBmaWxsPSIjQ0Q4NTNGIi8+PHJlY3QgeD0iNTQiIHk9IjUwIiB3aWR0aD0iMjAiIGhlaWdodD0iMTUiIHJ4PSIzIiBmaWxsPSIjQ0Q4NTNGIi8+PHJlY3QgeD0iODMiIHk9IjUwIiB3aWR0aD0iMjAiIGhlaWdodD0iMTUiIHJ4PSIzIiBmaWxsPSIjQ0Q4NTNGIi8+PC9zdmc+",
      "crystal-lamp":
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9IiNmOGZhZmMiLz48Y2lyY2xlIGN4PSI2NCIgY3k9IjEwMCIgcj0iMTIiIGZpbGw9IiM4QjQ1MTMiLz48cmVjdCB4PSI2MiIgeT0iMzAiIHdpZHRoPSI0IiBoZWlnaHQ9IjcwIiBmaWxsPSIjOEI0NTEzIi8+PHBvbHlnb24gcG9pbnRzPSI2NCwyMCA0NSw0NSA4Myw0NSIgZmlsbD0iI0Y1RjVEQyIgc3Ryb2tlPSIjQ0NDIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSI2NCIgY3k9IjMwIiByPSI1IiBmaWxsPSIjRkZENzAwIiBvcGFjaXR5PSIwLjgiLz48cG9seWdvbiBwb2ludHM9IjUwLDQ1IDc4LDQ1IDcwLDYwIDU4LDYwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNDQ0MiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC44Ii8+PC9zdmc+",
    };
    return thumbnails[itemId] || null;
  };

  // Catalog items for sale
  const catalogItems = [
    {
      id: "premium-sofa",
      name: "Sofá Premium",
      type: "furniture",
      price: 500,
      currency: "xenocoins",
      description: "Um sofá luxuoso e confortável",
    },
    {
      id: "crystal-lamp",
      name: "Luminária de Cristal",
      type: "furniture",
      price: 25,
      currency: "xenocash",
      description: "Luminária elegante de cristal",
    },
  ];

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
    }
  }, [isEditMode, user?.isAdmin]);

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
      case "store":
        // Add to inventory and remove from scene
        const furnitureName = objectId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

        // Generate thumbnail for inventory
        let thumbnail = "";
        if (experienceRef.current) {
          thumbnail = experienceRef.current.generateThumbnail(objectId);
        }

        setInventory((prev) => [
          ...prev,
          {
            id: objectId,
            name: furnitureName,
            type: "furniture",
            thumbnail,
          },
        ]);

        // Remove from 3D scene
        if (experienceRef.current) {
          experienceRef.current.removeFurniture(objectId);
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

  const handlePurchase = async (item: any) => {
    // Check if player has enough currency
    const currentAmount = item.currency === "xenocoins" ? xenocoins : cash;

    if (currentAmount < item.price) {
      alert(
        `Você não tem ${item.currency === "xenocoins" ? "Xenocoins" : "Xenocash"} suficiente!`,
      );
      return;
    }

    try {
      // Deduct currency using the game store
      const success = await updateCurrency(item.currency, -item.price);

      if (success) {
        // Add to inventory
        setInventory((prev) => [
          ...prev,
          {
            id: item.id,
            name: item.name,
            type: item.type,
            thumbnail: "", // Will be generated when placed
          },
        ]);

        alert(`${item.name} comprado com sucesso!`);
      } else {
        alert("Erro ao processar compra. Tente novamente.");
      }
    } catch (error) {
      console.error("Error purchasing item:", error);
      alert("Erro ao processar compra. Tente novamente.");
    }
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
            const success =
              await experienceRef.current.addFurnitureFromInventory(item.id, {
                x: worldPosition.x,
                y: worldPosition.y,
                z: worldPosition.z,
              });

            if (success) {
              // Remove from inventory
              setInventory((prev) =>
                prev.filter((invItem) => invItem.id !== item.id),
              );
            } else {
              console.warn(`Failed to place furniture: ${item.id}`);
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
        </motion.div>
      )}

      {/* Catalog Modal */}
      <DraggableModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        title="Catálogo de Móveis"
        modalId="catalog"
        width={600}
        height={700}
        zIndex={100}
      >
        <div className="p-6 h-full bg-white">
          {/* Tabs */}
          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCatalogTab("store")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
                catalogTab === "store"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Loja
            </button>
            {user?.isAdmin && (
              <button
                onClick={() => setCatalogTab("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
                  catalogTab === "admin"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Crown className="w-4 h-4" />
                Admin GLB
              </button>
            )}
          </div>

          {/* Currency Display */}
          <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=800"
                alt="Xenocoins"
                className="w-5 h-5"
              />
              <span className="font-bold text-gray-700">
                {xenocoins.toLocaleString()} Xenocoins
              </span>
            </div>
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fc013caa4db474e638dc2961a6085b60a%2F38a7eab3791441c7bc853afba8904317?format=webp&width=800"
                alt="Xenocash"
                className="w-5 h-5"
              />
              <span className="font-bold text-gray-700">
                {cash.toLocaleString()} Xenocash
              </span>
            </div>
          </div>

          {/* Tab Content */}
          {catalogTab === "store" ? (
            /* Store Catalog Items */
            <div className="grid grid-cols-2 gap-4 overflow-y-auto h-full">
              {catalogItems.map((item) => (
                <motion.div
                  key={item.id}
                  className="aspect-square border border-gray-300 rounded-lg flex flex-col items-center justify-center p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 mb-2">
                    {getItemThumbnail(item.id) ? (
                      <img
                        src={getItemThumbnail(item.id)}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Package size={20} className="text-blue-500 mb-1" />
                    )}
                  </div>

                  {/* Name */}
                  <span className="text-xs text-center font-medium text-gray-700 leading-tight mb-2">
                    {item.name}
                  </span>

                  {/* Price */}
                  <div className="flex items-center gap-1 mb-2">
                    {item.currency === "xenocoins" ? (
                      <img
                        src="https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=800"
                        alt="Xenocoins"
                        className="w-3 h-3"
                      />
                    ) : (
                      <img
                        src="https://cdn.builder.io/api/v1/image/assets%2Fc013caa4db474e638dc2961a6085b60a%2F38a7eab3791441c7bc853afba8904317?format=webp&width=800"
                        alt="Xenocash"
                        className="w-3 h-3"
                      />
                    )}
                    <span className="font-bold text-gray-700 text-xs">
                      {item.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Buy Button */}
                  <motion.button
                    onClick={() => handlePurchase(item)}
                    className={`px-3 py-1 rounded-lg font-medium text-xs transition-all ${
                      (item.currency === "xenocoins" ? xenocoins : cash) >=
                      item.price
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    whileHover={
                      (item.currency === "xenocoins" ? xenocoins : cash) >=
                      item.price
                        ? { scale: 1.05 }
                        : {}
                    }
                    whileTap={
                      (item.currency === "xenocoins" ? xenocoins : cash) >=
                      item.price
                        ? { scale: 0.95 }
                        : {}
                    }
                    disabled={
                      (item.currency === "xenocoins" ? xenocoins : cash) <
                      item.price
                    }
                  >
                    🛒 Comprar
                  </motion.button>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Admin GLB Management */
            <div className="space-y-4 overflow-y-auto h-full">
              {/* Upload Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                  Móveis GLB Customizados ({customFurniture.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      console.log("Force reload custom furniture...");
                      loadCustomFurniture();
                    }}
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                  >
                    Recarregar
                  </button>
                  <motion.button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-semibold shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-4 h-4" />
                    <Upload className="w-4 h-4" />
                    Adicionar GLB
                  </motion.button>
                </div>
              </div>

              {/* Custom Furniture List */}
              <div className="grid grid-cols-1 gap-3">
                {customFurniture.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      Nenhum móvel GLB adicionado ainda.
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Use o botão acima para fazer upload de arquivos GLB.
                    </p>
                  </div>
                ) : (
                  customFurniture.map((furniture, index) => (
                    <motion.div
                      key={furniture.id}
                      className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all bg-white"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {furniture.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {furniture.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              {furniture.category}
                            </span>
                            <div className="flex items-center gap-1">
                              <img
                                src="https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=800"
                                alt="Xenocoins"
                                className="w-4 h-4"
                              />
                              <span className="text-sm font-medium">
                                {furniture.price}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={() =>
                              window.open(furniture.glb_url, "_blank")
                            }
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Ver arquivo GLB"
                          >
                            <Package className="w-4 h-4 text-blue-600" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDeleteFurniture(furniture.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Deletar móvel"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          {catalogTab === "store" && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                🏠 Móveis comprados vão automaticamente para o inventário
                <br />
                💰 Ganhe Xenocoins e Xenocash explorando o jogo!
              </p>
            </div>
          )}
        </div>
      </DraggableModal>

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

      {/* GLB Upload Modal */}
      {showUploadModal && user?.isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Adicionar Móvel GLB
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arquivo GLB *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept=".glb"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="glb-upload"
                  />
                  <label
                    htmlFor="glb-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {uploadFile
                        ? uploadFile.name
                        : "Clique para selecionar arquivo GLB"}
                    </span>
                    <span className="text-xs text-gray-500">Máximo: 10MB</span>
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={uploadData.name}
                  onChange={(e) =>
                    setUploadData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Nome do móvel"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descrição do móvel..."
                />
              </div>

              {/* Price and Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço
                  </label>
                  <input
                    type="number"
                    value={uploadData.price}
                    onChange={(e) =>
                      setUploadData((prev) => ({
                        ...prev,
                        price: parseInt(e.target.value) || 10,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moeda
                  </label>
                  <select
                    value={uploadData.currency}
                    onChange={(e) =>
                      setUploadData((prev) => ({
                        ...prev,
                        currency: e.target.value as "xenocoins" | "cash",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="xenocoins">Xenocoins</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={uploadData.tags.join(", ")}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="mesa, cadeira, moderno"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <motion.button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancelar
              </motion.button>
              <motion.button
                onClick={handleFurnitureUpload}
                disabled={isUploading || !uploadFile || !uploadData.name.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Adicionar</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
