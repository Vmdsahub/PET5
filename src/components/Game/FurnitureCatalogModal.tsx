import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Package,
  Star,
  Clock,
  Crown,
  ShoppingCart,
  Coins,
  Gem,
  Upload,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { DraggableModal } from "../Layout/DraggableModal";
import {
  simpleFurnitureService as furnitureService,
  CustomFurniture,
} from "../../services/simpleFurnitureService";

interface FurnitureItem {
  id: string;
  name: string;
  price: number;
  currency: "xenocoins" | "xenocash";
  thumbnail: string;
  category: string;
  description?: string;
  isLimited?: boolean;
  adminOnly?: boolean;
  type?: string; // For custom furniture types
  catalogSection?: "admin" | "basic" | "xenocash" | "limited"; // Which section it belongs to
}

interface CatalogSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FurnitureItem[];
  isExpanded: boolean;
}

interface FurnitureCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userXenocoins: number;
  userXenocash: number;
  isAdmin?: boolean;
  onPurchaseItem: (item: FurnitureItem) => Promise<boolean>;
  onNotification?: (notification: {
    type: "success" | "error";
    title: string;
    message: string;
  }) => void;
}

export const FurnitureCatalogModal: React.FC<FurnitureCatalogModalProps> = ({
  isOpen,
  onClose,
  userXenocoins,
  userXenocash,
  isAdmin = false,
  onPurchaseItem,
  onNotification,
}) => {
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
  const [customFurniture, setCustomFurniture] = useState<CustomFurniture[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "xenocoins" as "xenocoins" | "xenocash",
    category: "admin" as "admin" | "premium" | "seasonal",
    tags: [] as string[],
  });
  const [sections, setSections] = useState<CatalogSection[]>([
    {
      id: "basic",
      title: "Móveis Básicos",
      icon: <Package className="w-5 h-5" />,
      isExpanded: true,
      items: [], // Empty - all built-in furniture removed
    },
    {
      id: "xenocash",
      title: "Móveis Xenocash",
      icon: <Gem className="w-5 h-5" />,
      isExpanded: false,
      items: [], // Empty - all built-in furniture removed
    },
    {
      id: "limited",
      title: "Móveis por Tempo Limitado",
      icon: <Clock className="w-5 h-5" />,
      isExpanded: false,
      items: [], // Empty - all built-in furniture removed
    },
  ]);

  // Load custom furniture for admin section
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

  // Add admin section with custom furniture
  useEffect(() => {
    if (isAdmin) {
      loadCustomFurniture();
    }
  }, [isAdmin]);

  // Reload furniture when modal opens
  useEffect(() => {
    if (isOpen && isAdmin) {
      console.log("Modal opened, reloading custom furniture...");
      loadCustomFurniture();
    }
  }, [isOpen, isAdmin]);

  // Initialize sample data on first load (local version)
  useEffect(() => {
    if (isAdmin) {
      // Add sample data if no furniture exists (for testing)
      const checkAndAddSample = async () => {
        const existing = await furnitureService.getAllCustomFurniture();
        if (existing.length === 0) {
          console.log("No furniture found, adding sample data...");
          furnitureService.addSampleData();
          loadCustomFurniture();
        }
      };
      checkAndAddSample();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (customFurniture.length >= 0) {
      console.log("Updating sections with custom furniture:", customFurniture);
      setSections((prev) => {
        // Create a function to convert custom furniture to catalog item
        const createCatalogItem = (
          furniture: any,
          sectionId: string,
        ): FurnitureItem => ({
          id: furniture.id,
          name: furniture.name,
          price: sectionId === "admin" ? 0 : furniture.price || 100, // Admin items are free
          currency: furniture.currency || "xenocoins",
          thumbnail: furniture.thumbnail_url || "", // Use stored thumbnail if available
          category: sectionId,
          description: furniture.description || "Móvel customizado.",
          adminOnly: sectionId === "admin",
          type: `custom_${furniture.id}`,
          catalogSection: furniture.catalogSection || "admin", // Store original section
        });

        // Distribute custom furniture to appropriate sections
        const adminItems = customFurniture
          .filter((f) => (f.catalogSection || "admin") === "admin")
          .map((f) => createCatalogItem(f, "admin"));

        const basicItems = customFurniture
          .filter((f) => f.catalogSection === "basic")
          .map((f) => createCatalogItem(f, "basic"));

        const xenocashItems = customFurniture
          .filter((f) => f.catalogSection === "xenocash")
          .map((f) => createCatalogItem(f, "xenocash"));

        const limitedItems = customFurniture
          .filter((f) => f.catalogSection === "limited")
          .map((f) => createCatalogItem(f, "limited"));

        // Update existing sections with custom items
        const updatedSections = prev.map((section) => {
          switch (section.id) {
            case "basic":
              return {
                ...section,
                items: [
                  ...section.items.filter(
                    (item) => !item.type?.startsWith("custom_"),
                  ),
                  ...basicItems,
                ],
              };
            case "xenocash":
              return {
                ...section,
                items: [
                  ...section.items.filter(
                    (item) => !item.type?.startsWith("custom_"),
                  ),
                  ...xenocashItems,
                ],
              };
            case "limited":
              return {
                ...section,
                items: [
                  ...section.items.filter(
                    (item) => !item.type?.startsWith("custom_"),
                  ),
                  ...limitedItems,
                ],
              };
            case "admin":
              return {
                ...section,
                items: adminItems,
                isExpanded: adminItems.length > 0,
              };
            default:
              return section;
          }
        });

        // Add admin section if it doesn't exist and we have admin items or user is admin
        const hasAdminSection = updatedSections.some((s) => s.id === "admin");
        if (!hasAdminSection && (adminItems.length > 0 || isAdmin)) {
          updatedSections.push({
            id: "admin",
            title: "Catálogo do Admin",
            icon: <Crown className="w-5 h-5" />,
            isExpanded: adminItems.length > 0,
            items: adminItems,
          });
        }

        // Filter out admin section for non-admin users
        const finalSections = isAdmin
          ? updatedSections
          : updatedSections.filter((s) => s.id !== "admin");

        console.log("Updated sections:", finalSections);
        return finalSections;
      });
    }
  }, [isAdmin, customFurniture]);

  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section,
      ),
    );
  };

  const handlePurchase = async (item: FurnitureItem) => {
    const success = await onPurchaseItem(item);
    if (success) {
      // Close modal after successful purchase
      onClose();
    }
  };

  const canAfford = (item: FurnitureItem) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.currency === "xenocoins") {
      return userXenocoins >= item.price;
    }
    return userXenocash >= item.price;
  };

  const getCurrencyIcon = (currency: "xenocoins" | "xenocash") => {
    return currency === "xenocoins" ? (
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=800"
        alt="Xenocoins"
        className="w-4 h-4"
      />
    ) : (
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2Fc013caa4db474e638dc2961a6085b60a%2F38a7eab3791441c7bc853afba8904317?format=webp&width=800"
        alt="Xenocash"
        className="w-4 h-4"
      />
    );
  };

  // Upload functions
  const handleUpload = async () => {
    if (!uploadFile || !uploadData.name.trim()) {
      onNotification?.({
        type: "error",
        title: "Erro",
        message: "Arquivo GLB e nome são obrigatórios.",
      });
      return;
    }

    // Check file size (warn if large, but don't block)
    const fileSizeMB = uploadFile.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      const confirmLarge = confirm(
        `O arquivo é grande (${fileSizeMB.toFixed(1)}MB). ` +
          "Arquivos grandes podem causar problemas de armazenamento. " +
          "Deseja continuar?",
      );
      if (!confirmLarge) {
        return;
      }
    }

    setIsUploading(true);
    try {
      const result = await furnitureService.uploadFurniture(uploadFile, {
        ...uploadData,
        price: 0, // Force price to 0 for admin items
        category: "admin",
      });

      if (result.success) {
        onNotification?.({
          type: "success",
          title: "Sucesso!",
          message: "Modelo 3D adicionado ao catálogo com sucesso.",
        });
        setShowUploadModal(false);
        resetUploadData();
        loadCustomFurniture(); // Reload the custom furniture
      } else {
        onNotification?.({
          type: "error",
          title: "Erro",
          message: result.error || "Erro ao fazer upload do modelo.",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      onNotification?.({
        type: "error",
        title: "Erro",
        message: "Erro interno do servidor.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadData = () => {
    setUploadFile(null);
    setUploadData({
      name: "",
      description: "",
      price: 0,
      currency: "xenocoins",
      category: "admin",
      tags: [],
    });
  };

  const handleMoveToSection = async (
    furnitureId: string,
    newSection: "admin" | "basic" | "xenocash" | "limited",
  ) => {
    try {
      console.log(`Moving furniture ${furnitureId} to section: ${newSection}`);
      const result = furnitureService.updateFurnitureCatalogSection(
        furnitureId,
        newSection,
      );

      if (result.success) {
        onNotification?.({
          type: "success",
          title: "Sucesso!",
          message: `Móvel movido para seção "${newSection}" com sucesso.`,
        });
        loadCustomFurniture(); // Reload to update sections
      } else {
        onNotification?.({
          type: "error",
          title: "Erro",
          message: result.error || "Erro ao mover móvel.",
        });
      }
    } catch (error) {
      console.error("Move section error:", error);
      onNotification?.({
        type: "error",
        title: "Erro",
        message: "Erro interno do servidor.",
      });
    }
  };

  const handleUpdatePrice = async (
    furnitureId: string,
    price: number,
    currency: "xenocoins" | "xenocash",
  ) => {
    try {
      console.log(
        `Updating price for furniture ${furnitureId}: ${price} ${currency}`,
      );
      const result = furnitureService.updateFurniturePrice(
        furnitureId,
        price,
        currency,
      );

      if (result.success) {
        onNotification?.({
          type: "success",
          title: "Preço Atualizado!",
          message: `Preço atualizado para ${price} ${currency === "xenocoins" ? "Xenocoins" : "Xenocash"}.`,
        });
        loadCustomFurniture(); // Reload to update display
      } else {
        onNotification?.({
          type: "error",
          title: "Erro",
          message: result.error || "Erro ao atualizar preço.",
        });
      }
    } catch (error) {
      console.error("Update price error:", error);
      onNotification?.({
        type: "error",
        title: "Erro",
        message: "Erro interno do servidor.",
      });
    }
  };

  const handleDeleteCustomFurniture = async (furnitureId: string) => {
    if (confirm("Tem certeza que deseja deletar este modelo 3D?")) {
      try {
        const result = await furnitureService.deleteFurniture(furnitureId);
        if (result.success) {
          onNotification?.({
            type: "success",
            title: "Sucesso!",
            message: "Modelo 3D deletado com sucesso.",
          });
          loadCustomFurniture();
        } else {
          onNotification?.({
            type: "error",
            title: "Erro",
            message: result.error || "Erro ao deletar modelo.",
          });
        }
      } catch (error) {
        console.error("Delete error:", error);
        onNotification?.({
          type: "error",
          title: "Erro",
          message: "Erro interno do servidor.",
        });
      }
    }
  };

  return (
    <>
      <DraggableModal
        isOpen={isOpen}
        onClose={onClose}
        title="Catálogo de Móveis"
        modalId="furniture-catalog"
        width={800}
        height={600}
        zIndex={100}
      >
        <div className="flex h-full bg-white">
          {/* Left Panel - Categories */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            {/* Currency Display */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=800"
                    alt="Xenocoins"
                    className="w-5 h-5"
                  />
                  <span className="font-semibold text-gray-700">
                    {userXenocoins.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fc013caa4db474e638dc2961a6085b60a%2F38a7eab3791441c7bc853afba8904317?format=webp&width=800"
                    alt="Xenocash"
                    className="w-5 h-5"
                  />
                  <span className="font-semibold text-gray-700">
                    {userXenocash.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto">
              {sections.map((section) => (
                <div key={section.id} className="border-b border-gray-100">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="font-medium text-gray-800">
                        {section.title}
                      </span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {section.items.length}
                      </span>
                    </div>
                    {section.isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {/* Section Items */}
                  <AnimatePresence>
                    {section.isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {section.items.map((item) => (
                          <motion.div
                            key={item.id}
                            className={`p-3 mx-4 mb-2 border border-gray-200 rounded-lg cursor-pointer transition-all ${
                              selectedItem?.id === item.id
                                ? "bg-blue-50 border-blue-300"
                                : "hover:bg-gray-50"
                            } ${!canAfford(item) ? "opacity-60" : ""}`}
                            onClick={() => setSelectedItem(item)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {item.type?.startsWith("custom_") ? (
                                  <CatalogThumbnail item={item} />
                                ) : (
                                  <Package className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-gray-800">
                                    {item.name}
                                  </span>
                                  {item.isLimited && (
                                    <Clock className="w-3 h-3 text-orange-500" />
                                  )}
                                  {item.adminOnly && (
                                    <Crown className="w-3 h-3 text-purple-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  {getCurrencyIcon(item.currency)}
                                  <span className="text-xs font-semibold text-gray-600">
                                    {item.price.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              {/* Action buttons for custom items */}
                              {item.type?.startsWith("custom_") && isAdmin && (
                                <div className="flex flex-col gap-1">
                                  <div className="flex gap-1">
                                    {/* Move to section dropdown */}
                                    <select
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleMoveToSection(
                                          item.id,
                                          e.target.value as any,
                                        );
                                      }}
                                      value={item.catalogSection || "admin"}
                                      className="text-xs px-1 py-1 border rounded hover:bg-gray-50 transition-colors"
                                      title="Mover para seção"
                                    >
                                      <option value="admin">Admin</option>
                                      <option value="basic">Básicos</option>
                                      <option value="xenocash">Xenocash</option>
                                      <option value="limited">Limitado</option>
                                    </select>

                                    {/* Delete button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCustomFurniture(item.id);
                                      }}
                                      className="p-1 hover:bg-red-100 rounded transition-colors"
                                      title="Deletar modelo"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-600" />
                                    </button>
                                  </div>

                                  {/* Price editing for non-admin sections */}
                                  {item.catalogSection !== "admin" && (
                                    <div className="flex gap-1 items-center">
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={item.price || 0}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          const newPrice =
                                            e.target.value === ""
                                              ? 0
                                              : Number(e.target.value);
                                          console.log(
                                            `💰 Updating price to: ${newPrice}`,
                                          );
                                          handleUpdatePrice(
                                            item.id,
                                            newPrice,
                                            item.currency,
                                          );
                                        }}
                                        className="w-16 text-xs px-1 py-1 border rounded"
                                        title="Preço (0 = gratuito)"
                                        placeholder="0"
                                      />
                                      <select
                                        value={item.currency}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleUpdatePrice(
                                            item.id,
                                            item.price,
                                            e.target.value as any,
                                          );
                                        }}
                                        className="text-xs px-1 py-1 border rounded"
                                        title="Moeda"
                                      >
                                        <option value="xenocoins">XC</option>
                                        <option value="xenocash">XS</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}

                        {/* Upload button for admin section */}
                        {section.id === "admin" &&
                          isAdmin &&
                          section.isExpanded && (
                            <motion.button
                              onClick={() => setShowUploadModal(true)}
                              className="mx-4 mb-2 p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 transition-colors bg-purple-50 hover:bg-purple-100"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-center gap-3 text-purple-700">
                                <Upload className="w-5 h-5" />
                                <span className="font-medium">
                                  Enviar modelo 3D
                                </span>
                              </div>
                              <p className="text-xs text-purple-600 mt-1">
                                Adicione arquivos GLB ao catálogo
                              </p>
                            </motion.button>
                          )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 p-6 flex flex-col">
            {selectedItem ? (
              <div className="flex flex-col h-full">
                {/* Item Image */}
                <div className="flex-1 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                </div>

                {/* Item Details */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {selectedItem.name}
                      </h3>
                      {selectedItem.isLimited && (
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Limitado
                        </span>
                      )}
                      {selectedItem.adminOnly && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {selectedItem.description}
                    </p>
                  </div>

                  {/* Price and Purchase */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Preço:</span>
                      <div className="flex items-center gap-2">
                        {getCurrencyIcon(selectedItem.currency)}
                        <span className="font-bold text-lg">
                          {selectedItem.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <motion.button
                      onClick={() => handlePurchase(selectedItem)}
                      disabled={!canAfford(selectedItem)}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                        canAfford(selectedItem)
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      whileHover={
                        canAfford(selectedItem) ? { scale: 1.02 } : {}
                      }
                      whileTap={canAfford(selectedItem) ? { scale: 0.98 } : {}}
                    >
                      {canAfford(selectedItem)
                        ? "Comprar"
                        : "Saldo Insuficiente"}
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Selecione um móvel</p>
                  <p className="text-sm">
                    Escolha um item do catálogo para ver os detalhes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DraggableModal>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
            <motion.div
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Enviar Modelo 3D
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
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] || null)
                      }
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
                      <span className="text-xs text-gray-500">
                        Máximo: 100MB
                      </span>
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
                      setUploadData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
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

                {/* Info about free price */}
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    🎁 Todos os itens do admin são gratuitos (0 Xenocoins)
                  </p>
                </div>

                {/* Local Storage Management */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">
                    💾 Sistema Simples (Na Memória)
                  </p>

                  <div className="text-xs text-blue-600 mb-2">
                    <span>Itens carregados: {furnitureService.getCount()}</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        const success = furnitureService.testSystem();
                        onNotification?.({
                          type: success ? "success" : "error",
                          title: success
                            ? "Sistema OK"
                            : "Sistema com Problema",
                          message: success
                            ? "Sistema funcionando corretamente."
                            : "Problema no sistema. Verifique o console.",
                        });
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                    >
                      Testar Sistema
                    </button>
                    <button
                      onClick={() => {
                        furnitureService.addSampleData();
                        loadCustomFurniture();
                        onNotification?.({
                          type: "success",
                          title: "Exemplo Adicionado",
                          message: "Item de exemplo adicionado com sucesso.",
                        });
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Adicionar Exemplo
                    </button>
                    <button
                      onClick={() => {
                        furnitureService.clearAll();
                        setCustomFurniture([]);
                        onNotification?.({
                          type: "success",
                          title: "Limpo",
                          message: "Todos os itens foram removidos.",
                        });
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Limpar Tudo
                    </button>
                  </div>
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
                  onClick={handleUpload}
                  disabled={
                    isUploading || !uploadFile || !uploadData.name.trim()
                  }
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
                      <span>Enviar</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// Component to show thumbnails for catalog items (same as inventory)
const CatalogThumbnail: React.FC<{ item: FurnitureItem }> = ({ item }) => {
  if (item.type?.startsWith("custom_")) {
    // For GLB items, show 3D indicator - thumbnails will be generated when purchased
    // This matches the behavior where thumbnails are created during the purchase flow
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 rounded">
        <div className="w-6 h-6 bg-purple-200 rounded flex items-center justify-center mb-1">
          <span className="text-purple-700 font-bold text-xs">3D</span>
        </div>
        <span className="text-purple-600 text-xs font-medium">GLB</span>
      </div>
    );
  }

  return <Package className="w-5 h-5 text-gray-500" />;
};
