import React, { useState } from 'react';
import { ShoppingCart, Package, Home, X, Trash2 } from 'lucide-react';
import { FurnitureItem } from '../../services/mockStorage';
import { SimpleModal } from './SimpleModal';

interface RoomUIProps {
  inventory: FurnitureItem[];
  catalog: Omit<FurnitureItem, 'id' | 'position' | 'rotation' | 'scale'>[];
  selectedFurniture: string | null;
  onPlaceFurniture: (furnitureId: string, position: [number, number, number]) => void;
  onRemoveFurniture: (furnitureId: string) => void;
  onBuyFurniture: (catalogItem: any) => FurnitureItem;
  onSelectFurniture: (furnitureId: string | null) => void;
  isDragging: boolean;
}

export const RoomUI: React.FC<RoomUIProps> = ({
  inventory,
  catalog,
  selectedFurniture,
  onPlaceFurniture,
  onRemoveFurniture,
  onBuyFurniture,
  onSelectFurniture,
  isDragging
}) => {
  const [showCatalog, setShowCatalog] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [draggedItem, setDraggedItem] = useState<FurnitureItem | null>(null);
  const [activeTab, setActiveTab] = useState<'basicos' | 'limitados'>('basicos');

  const handleDragStart = (item: FurnitureItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = (event: React.DragEvent) => {
    if (draggedItem) {
      // Calcular posição 3D baseada na posição do mouse
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
      const z = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
      
      onPlaceFurniture(draggedItem.id, [x, 0.5, z]);
      setDraggedItem(null);
    }
  };

  const handleBuy = (catalogItem: any) => {
    onBuyFurniture(catalogItem);
  };

  const selectedItem = inventory.find(item => item.id === selectedFurniture) || 
                      null;

  return (
    <>
      {/* Navegação vertical esquerda */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="bg-white/90 backdrop-blur rounded-full shadow-lg p-2 space-y-3 border border-white/20 flex flex-col">
          {/* Botão Catálogo */}
          <button
            onClick={() => {
              setShowInventory(false);
              setShowCatalog(true);
            }}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
            title="Catálogo de Móveis"
          >
            <ShoppingCart size={24} className="text-gray-700" />
          </button>

          {/* Botão Inventário */}
          <button
            onClick={() => {
              setShowCatalog(false);
              setShowInventory(true);
            }}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors relative"
            title="Inventário da Casa"
          >
            <Package size={24} className="text-gray-700" />
            {inventory.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {inventory.length}
              </span>
            )}
          </button>

          {/* Botão Home */}
          <button
            onClick={() => {
              setShowCatalog(false);
              setShowInventory(false);
              onSelectFurniture(null);
            }}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
            title="Fechar Modais"
          >
            <Home size={24} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* Informações do móvel selecionado */}
      {selectedFurniture && selectedItem && !isDragging && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-xs z-10">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
            <button
              onClick={() => onSelectFurniture(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-3">{selectedItem.description}</p>
          <div className="space-y-2">
            <div className="text-sm text-gray-500">
              Categoria: <span className="capitalize">{selectedItem.category}</span>
            </div>
            <button
              onClick={() => onRemoveFurniture(selectedItem.id)}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <Trash2 size={16} />
              <span>Remover</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal do Catálogo */}
      {showCatalog && (
        <SimpleModal
          title="Catálogo de Móveis"
          onClose={() => setShowCatalog(false)}
          initialPosition={{ x: 100, y: 100 }}
          width="500px"
        >
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {catalog.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    <Package size={32} className="text-gray-400" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      ${item.price}
                    </span>
                    <button
                      onClick={() => handleBuy(item)}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SimpleModal>
      )}

      {/* Modal do Inventário */}
      {showInventory && (
        <SimpleModal
          title="Inventário da Casa"
          onClose={() => setShowInventory(false)}
          initialPosition={{ x: 200, y: 100 }}
          width="500px"
        >
          <div className="max-h-96 overflow-y-auto">
            {inventory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Seu inventário está vazio</p>
                <p className="text-sm">Compre móveis no catálogo!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onDragEnd={handleDragEnd}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-move"
                  >
                    <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Package size={24} className="text-gray-400" />
                    </div>
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-gray-600 text-xs mb-2">{item.description}</p>
                    <div className="text-xs text-gray-500">
                      Categoria: <span className="capitalize">{item.category}</span>
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      Arraste para o quarto
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SimpleModal>
      )}

      {/* Overlay de drag and drop */}
      {draggedItem && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
            Colocando {draggedItem.name}...
          </div>
        </div>
      )}
    </>
  );
};
