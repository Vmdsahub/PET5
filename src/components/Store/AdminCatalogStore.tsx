import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sofa,
  ShoppingCart,
  Star,
  Package,
  CheckCircle,
  AlertCircle,
  X,
  Crown,
  Sparkles,
  Upload,
  Plus,
  Settings,
} from "lucide-react";
import {
  furnitureService,
  CustomFurniture,
} from "../../services/furnitureService";
import { useGameStore } from "../../store/gameStore";

interface PurchaseResult {
  success: boolean;
  message: string;
  newBalance?: number;
}

export const AdminCatalogStore: React.FC = () => {
  const [customFurniture, setCustomFurniture] = useState<CustomFurniture[]>([]);
  const [selectedFurniture, setSelectedFurniture] =
    useState<CustomFurniture | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Admin upload functionality
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

  const { user, xenocoins, addNotification, updateCurrency } = useGameStore();

  useEffect(() => {
    loadCustomFurniture();
  }, []);

  const loadCustomFurniture = async () => {
    try {
      setLoading(true);
      const furniture = await furnitureService.getAllCustomFurniture();
      // Filter only admin category furniture
      const adminFurniture = furniture.filter(
        (f) => f.category === "admin" && f.is_active,
      );
      setCustomFurniture(adminFurniture);
    } catch (error) {
      console.error("Error loading custom furniture:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFurnitureClick = (furniture: CustomFurniture) => {
    setSelectedFurniture(furniture);
    setShowPurchaseModal(true);
    setPurchaseResult(null);
  };

  const handlePurchase = async () => {
    if (!selectedFurniture || !user) return;

    try {
      const result = await furnitureService.purchaseCustomFurniture(
        selectedFurniture.id,
        user.id,
      );

      setPurchaseResult(result);

      if (result.success && result.newBalance !== undefined) {
        // Update the currency in the game store
        updateCurrency("xenocoins", result.newBalance);

        addNotification({
          type: "success",
          title: "Compra realizada!",
          message: result.message,
        });

        // Close modal after successful purchase
        setTimeout(() => {
          setShowPurchaseModal(false);
          setSelectedFurniture(null);
          setPurchaseResult(null);
        }, 2000);
      } else {
        addNotification({
          type: "error",
          title: "Erro na compra",
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      setPurchaseResult({
        success: false,
        message: "Erro interno do servidor",
      });
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

  const getCategoryColor = (category: string) => {
    const colors = {
      admin: "from-purple-500 to-indigo-500",
      premium: "from-yellow-500 to-orange-500",
      seasonal: "from-green-500 to-blue-500",
    };
    return colors[category as keyof typeof colors] || colors.admin;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "admin":
        return Crown;
      case "premium":
        return Star;
      case "seasonal":
        return Sparkles;
      default:
        return Package;
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto pb-12">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sofa className="w-12 h-12 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-12">
      {/* Header */}
      <motion.div
        className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Catálogo de Admin
            </h1>
            <p className="text-gray-600">
              Móveis exclusivos criados pelos administradores
            </p>
          </div>
        </div>

        {/* Currency Display */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
          <span className="text-gray-700 font-medium">Seu Saldo:</span>
          <div className="flex items-center space-x-1">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=800"
              alt="Xenocoins"
              className="w-6 h-6"
            />
            <span className="font-bold text-purple-800">
              {xenocoins.toLocaleString()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Furniture Grid */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {customFurniture.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sofa className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Nenhum Móvel Disponível
            </h3>
            <p className="text-gray-600">
              Os administradores ainda não adicionaram móveis ao catálogo.
            </p>
          </div>
        ) : (
          customFurniture.map((furniture, index) => {
            const CategoryIcon = getCategoryIcon(furniture.category);
            return (
              <motion.div
                key={furniture.id}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 cursor-pointer hover:shadow-2xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFurnitureClick(furniture)}
              >
                {/* Header */}
                <div
                  className={`bg-gradient-to-r ${getCategoryColor(furniture.category)} text-white p-6`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CategoryIcon className="w-5 h-5" />
                        <span className="text-xs uppercase tracking-wide font-semibold">
                          {furniture.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">
                        {furniture.name}
                      </h3>
                      <p className="text-white/90 text-sm mb-3">
                        {furniture.description || "Móvel customizado exclusivo"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="w-3 h-3 rounded-full bg-green-400 mb-2"></div>
                      <span className="text-xs font-medium">Disponível</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Tags */}
                  {furniture.tags && furniture.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {furniture.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {furniture.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{furniture.tags.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src="https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=800"
                        alt="Xenocoins"
                        className="w-6 h-6"
                      />
                      <span className="font-bold text-xl text-purple-800">
                        {furniture.price}
                      </span>
                      <span className="text-gray-600 text-sm">Xenocoins</span>
                    </div>

                    <motion.div
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2"
                      whileHover={{ scale: 1.05 }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span className="font-medium text-sm">Comprar</span>
                    </motion.div>
                  </div>

                  {/* Creation date */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      Adicionado em{" "}
                      {new Date(furniture.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedFurniture && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPurchaseModal(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100">
                {purchaseResult ? (
                  <PurchaseResultModal
                    result={purchaseResult}
                    furniture={selectedFurniture}
                  />
                ) : (
                  <PurchaseConfirmModal
                    furniture={selectedFurniture}
                    onConfirm={handlePurchase}
                    onCancel={() => setShowPurchaseModal(false)}
                    userBalance={xenocoins}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Purchase Confirmation Modal Component
const PurchaseConfirmModal: React.FC<{
  furniture: CustomFurniture;
  onConfirm: () => void;
  onCancel: () => void;
  userBalance: number;
}> = ({ furniture, onConfirm, onCancel, userBalance }) => {
  const canAfford = userBalance >= furniture.price;
  const CategoryIcon = furniture.category === "admin" ? Crown : Star;

  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4">
        <CategoryIcon className="w-10 h-10 text-purple-600" />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{furniture.name}</h3>

      <p className="text-gray-600 mb-4 text-sm">
        {furniture.description || "Móvel customizado exclusivo"}
      </p>

      {/* Price display */}
      <div className="bg-purple-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-purple-900">Preço:</span>
          <div className="flex items-center space-x-2">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Ff481900009a94cda953c032479392a30%2F3e6c6cb85c6a4d2ba05acb245bfbc214?format=webp&width=800"
              alt="Xenocoins"
              className="w-6 h-6"
            />
            <span className="font-bold text-xl text-purple-900">
              {furniture.price}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-purple-700">Seu saldo:</span>
          <span
            className={`font-medium ${canAfford ? "text-green-600" : "text-red-600"}`}
          >
            {userBalance.toLocaleString()} Xenocoins
          </span>
        </div>
      </div>

      {!canAfford && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-700 text-sm font-medium">
              Saldo insuficiente
            </span>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <motion.button
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancelar
        </motion.button>
        <motion.button
          onClick={onConfirm}
          disabled={!canAfford}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          whileHover={{ scale: canAfford ? 1.02 : 1 }}
          whileTap={{ scale: canAfford ? 0.98 : 1 }}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Comprar</span>
        </motion.button>
      </div>
    </div>
  );
};

// Purchase Result Modal Component
const PurchaseResultModal: React.FC<{
  result: PurchaseResult;
  furniture: CustomFurniture;
}> = ({ result, furniture }) => {
  return (
    <div className="text-center">
      <div
        className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
          result.success ? "bg-green-100" : "bg-red-100"
        }`}
      >
        {result.success ? (
          <CheckCircle className="w-10 h-10 text-green-600" />
        ) : (
          <AlertCircle className="w-10 h-10 text-red-600" />
        )}
      </div>

      <h3
        className={`text-xl font-bold mb-2 ${
          result.success ? "text-green-900" : "text-red-900"
        }`}
      >
        {result.success ? "Compra Realizada!" : "Erro na Compra"}
      </h3>

      <p
        className={`mb-4 ${result.success ? "text-green-700" : "text-red-700"}`}
      >
        {result.message}
      </p>

      {result.success && result.newBalance !== undefined && (
        <div className="bg-green-50 rounded-xl p-3 mb-4">
          <p className="text-green-800 text-sm">
            Novo saldo: {result.newBalance.toLocaleString()} Xenocoins
          </p>
          <p className="text-green-600 text-xs mt-1">
            O móvel "{furniture.name}" foi adicionado ao seu inventário!
          </p>
        </div>
      )}
    </div>
  );
};
