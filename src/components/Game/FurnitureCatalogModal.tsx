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
} from "lucide-react";
import { DraggableModal } from "../Layout/DraggableModal";

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
}

export const FurnitureCatalogModal: React.FC<FurnitureCatalogModalProps> = ({
  isOpen,
  onClose,
  userXenocoins,
  userXenocash,
  isAdmin = false,
}) => {
  const [selectedItem, setSelectedItem] = useState<FurnitureItem | null>(null);
  const [sections, setSections] = useState<CatalogSection[]>([
    {
      id: "basic",
      title: "Móveis Básicos",
      icon: <Package className="w-5 h-5" />,
      isExpanded: true,
      items: [
        {
          id: "basic-chair",
          name: "Cadeira Simples",
          price: 50,
          currency: "xenocoins",
          thumbnail:
            "https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=200",
          category: "basic",
          description: "Uma cadeira básica e confortável para sua decoração.",
        },
        {
          id: "basic-table",
          name: "Mesa de Madeira",
          price: 100,
          currency: "xenocoins",
          thumbnail:
            "https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=200",
          category: "basic",
          description: "Mesa resistente de madeira natural.",
        },
        {
          id: "basic-lamp",
          name: "Luminária",
          price: 75,
          currency: "xenocoins",
          thumbnail:
            "https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=200",
          category: "basic",
          description: "Iluminação básica para seu ambiente.",
        },
      ],
    },
    {
      id: "xenocash",
      title: "Móveis Xenocash",
      icon: <Gem className="w-5 h-5" />,
      isExpanded: false,
      items: [
        {
          id: "premium-sofa",
          name: "Sofá Premium",
          price: 25,
          currency: "xenocash",
          thumbnail:
            "https://cdn.builder.io/api/v1/image/assets%2Fc013caa4db474e638dc2961a6085b60a%2F38a7eab3791441c7bc853afba8904317?format=webp&width=200",
          category: "premium",
          description: "Sofá luxuoso com acabamento premium.",
        },
        {
          id: "crystal-chandelier",
          name: "Lustre de Cristal",
          price: 50,
          currency: "xenocash",
          thumbnail:
            "https://cdn.builder.io/api/v1/image/assets%2Fc013caa4db474e638dc2961a6085b60a%2F38a7eab3791441c7bc853afba8904317?format=webp&width=200",
          category: "premium",
          description: "Elegante lustre de cristal que ilumina com estilo.",
        },
      ],
    },
    {
      id: "limited",
      title: "Móveis por Tempo Limitado",
      icon: <Clock className="w-5 h-5" />,
      isExpanded: false,
      items: [
        {
          id: "seasonal-decoration",
          name: "Decoração Sazonal",
          price: 200,
          currency: "xenocoins",
          thumbnail:
            "https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=200",
          category: "limited",
          description: "Item exclusivo disponível por tempo limitado!",
          isLimited: true,
        },
      ],
    },
  ]);

  // Add admin section if user is admin
  useEffect(() => {
    if (isAdmin) {
      setSections((prev) => {
        const hasAdminSection = prev.some((section) => section.id === "admin");
        if (!hasAdminSection) {
          return [
            ...prev,
            {
              id: "admin",
              title: "Catálogo do Admin",
              icon: <Crown className="w-5 h-5" />,
              isExpanded: false,
              items: [
                {
                  id: "admin-throne",
                  name: "Trono Real",
                  price: 0,
                  currency: "xenocoins",
                  thumbnail:
                    "https://cdn.builder.io/api/v1/image/assets%2Fc013caa4db474e638dc2961a6085b60a%2F38a7eab3791441c7bc853afba8904317?format=webp&width=200",
                  category: "admin",
                  description: "Móvel exclusivo para administradores.",
                  adminOnly: true,
                },
              ],
            },
          ];
        }
        return prev;
      });
    }
  }, [isAdmin]);

  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section,
      ),
    );
  };

  const handlePurchase = (item: FurnitureItem) => {
    // TODO: Implement purchase logic
    console.log("Purchasing item:", item);
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

  return (
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
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-500" />
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
                          </div>
                        </motion.div>
                      ))}
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
                    whileHover={canAfford(selectedItem) ? { scale: 1.02 } : {}}
                    whileTap={canAfford(selectedItem) ? { scale: 0.98 } : {}}
                  >
                    {canAfford(selectedItem) ? "Comprar" : "Saldo Insuficiente"}
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
  );
};
