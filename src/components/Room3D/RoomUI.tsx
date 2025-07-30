import React, { useState } from 'react';
import { ShoppingCart, Package, Home, X, Trash2, Plus, Edit3 } from 'lucide-react';
import { FurnitureItem } from '../../services/mockStorage';
import { SimpleModal } from './SimpleModal';
import { AddFurnitureModal } from './AddFurnitureModal';
import { FurnitureAdminPanel } from './FurnitureAdminPanel';
import { FurnitureThumbnail } from './FurnitureThumbnail';
import { TexturePreview } from './TexturePreview';
import { useAuthStore } from '../../store/authStore';
import { mockStorageService } from '../../services/mockStorage';

interface RoomUIProps {
  inventory: FurnitureItem[];
  catalog: Omit<FurnitureItem, 'id' | 'position' | 'rotation' | 'scale'>[];
  selectedFurniture: string | null;
  onPlaceFurniture: (furnitureId: string, position: [number, number, number]) => void;
  onRemoveFurniture: (furnitureId: string) => void;
  onBuyFurniture: (catalogItem: any) => FurnitureItem;
  onSelectFurniture: (furnitureId: string | null) => void;
  isDragging: boolean;
  isAdmin?: boolean;
  onAddFurniture?: (furnitureData: any) => void;
  onDraggedTexture?: (texture: any) => void;
  draggedTexture?: any;
  editMode?: boolean;
  onToggleEditMode?: () => void;
  onStoreFurniture?: (furnitureId: string) => void;
  contextMenuState?: {
    visible: boolean;
    x: number;
    y: number;
    furnitureId: string | null;
  };
  onCloseContextMenu?: () => void;
}

export const RoomUI: React.FC<RoomUIProps> = ({
  inventory,
  catalog,
  selectedFurniture,
  onPlaceFurniture,
  onRemoveFurniture,
  onBuyFurniture,
  onSelectFurniture,
  isDragging,
  isAdmin = false,
  onAddFurniture,
  onDraggedTexture,
  draggedTexture,
  editMode = false,
  onToggleEditMode,
  onStoreFurniture,
  contextMenuState,
  onCloseContextMenu
}) => {
  const { user } = useAuthStore();
  const isUserAdmin = user?.isAdmin || isAdmin;
  const [showCatalog, setShowCatalog] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [draggedItem, setDraggedItem] = useState<FurnitureItem | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number, y: number } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any>(null);
  const [showAddFurniture, setShowAddFurniture] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [sectionsVersion, setSectionsVersion] = useState(0);
  // Usar contexto externo ou estado local como fallback
  const [localContextMenu, setLocalContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    furnitureId: string | null;
  }>({ visible: false, x: 0, y: 0, furnitureId: null });

  const contextMenu = contextMenuState || localContextMenu;

  const handleDragStart = (item: FurnitureItem, event: React.DragEvent) => {
    if ((item as any).isTexture) {
      // É uma textura, configurar para arrastar textura
      onDraggedTexture?.(item);
    } else {
      // É um móvel, manter lógica original
      setDraggedItem(item);
    }

    // Criar uma imagem ghost transparente
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(dragImage, 0, 0);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (draggedItem || draggedTexture) {
      setDragPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();

    if (draggedItem) {
      // Lógica original para móveis
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        const z = ((event.clientY - rect.top) / rect.height - 0.5) * 8;

        onPlaceFurniture(draggedItem.id, [x, 0, z]);
      }
      setDraggedItem(null);
      setDragPosition(null);
    } else if (draggedTexture) {
      // Para texturas, apenas limpar o estado - a aplicação acontece via clique nas superfícies
      // O usuário deve clicar na superfície (chão, parede, teto) para aplicar
      console.log('Textura arrastada para o quarto. Clique na superfície desejada para aplicar.');
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragPosition(null);
    onDraggedTexture?.(null);
  };

  const handleContextMenu = (event: React.MouseEvent, furnitureId: string) => {
    event.preventDefault();
    if (onCloseContextMenu) {
      // Usar estado externo (não deveria chegar aqui com nova implementação)
    } else {
      setLocalContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        furnitureId
      });
    }
  };

  const handleCloseContextMenu = () => {
    if (onCloseContextMenu) {
      onCloseContextMenu();
    } else {
      setLocalContextMenu({ visible: false, x: 0, y: 0, furnitureId: null });
    }
  };

  const handleInspectFurniture = () => {
    if (contextMenu.furnitureId) {
      onSelectFurniture(contextMenu.furnitureId);
    }
    handleCloseContextMenu();
  };

  const handleStoreFurniture = () => {
    if (contextMenu.furnitureId) {
      onStoreFurniture?.(contextMenu.furnitureId);
    }
    handleCloseContextMenu();
  };

  const handleDiscardFurniture = () => {
    if (contextMenu.furnitureId) {
      const confirmed = window.confirm('Tem certeza que deseja descartar este móvel? Esta ação não pode ser desfeita.');
      if (confirmed) {
        // Usar a nova função de deletar do mockStorage
        const { user } = useAuthStore.getState();
        if (user) {
          const success = mockStorageService.deleteInventoryFurniture(user.id, contextMenu.furnitureId);
          if (success) {
            // Forçar re-render removendo o item do estado local se necessário
            console.log('Móvel descartado com sucesso');
          }
        }
      }
    }
    handleCloseContextMenu();
  };

  // Fechar menu de contexto ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        handleCloseContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible]);

  // Cleanup quando contexto muda
  React.useEffect(() => {
    if (!contextMenu.visible && contextMenuState?.visible === false) {
      // Sincronizar estados se necessário
    }
  }, [contextMenu.visible, contextMenuState]);

  const handleBuy = (catalogItem: any) => {
    onBuyFurniture(catalogItem);
  };

  const selectedItem = inventory.find(item => item.id === selectedFurniture) ||
                      null;

  // Obter todas as seções disponíveis (re-executar quando sectionsVersion muda)
  const allSections = React.useMemo(() => mockStorageService.getAllSections(), [sectionsVersion]);
  const customSections = React.useMemo(() => mockStorageService.getCustomSections(), [sectionsVersion]);



  // Agrupar móveis por seções customizadas (apenas móveis exatamente dessa categoria)
  const customSectionsFurniture = customSections.reduce((acc, section) => {
    acc[section] = catalog.filter(item => item.category === section);
    return acc;
  }, {} as Record<string, typeof catalog>);

  return (
    <>
      {/* Indicador de Modo Edi��ão */}
      {editMode && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl shadow-2xl border border-purple-400">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-3 flex items-center justify-center">
              <span className="mr-2">🎮</span>
              Modo Edição Ativo
            </h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <span>Móvel: Mover</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-white rounded-full border border-gray-400"></div>
                  <span>Círculo: Rotacionar</span>
                </div>
              </div>
              {isUserAdmin ? (
                <>
                  <div className="flex items-center justify-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-2 bg-blue-400 rounded"></div>
                      <span>X (Largura)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-4 bg-red-400 rounded"></div>
                      <span>Y (Altura)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-2 bg-green-400 rounded"></div>
                      <span>Z (Profundidade)</span>
                    </div>
                  </div>
                  <p className="text-xs opacity-75 text-yellow-200 mt-1">
                    ⚠️ Alterações de escala são permanentes no catálogo
                  </p>
                </>
              ) : (
                <p className="text-xs opacity-90">
                  Controles de escala disponíveis apenas para administradores
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Área de drop invisível sobre todo o canvas */}
      {draggedItem && (
        <div
          className="fixed inset-0 z-40 pointer-events-auto"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      )}
      {/* Navegação vertical esquerda */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
        <div className="bg-white/90 backdrop-blur rounded-full shadow-lg p-2 space-y-3 border border-white/20 flex flex-col">
          {/* Botão Catálogo */}
          <button
            onClick={() => {
              setShowCatalog(!showCatalog);
            }}
            className={`p-3 rounded-full transition-colors ${
              showCatalog ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Catálogo de Móveis"
          >
            <ShoppingCart size={24} />
          </button>

          {/* Botão Inventário */}
          <button
            onClick={() => {
              setShowInventory(!showInventory);
            }}
            className={`p-3 rounded-full transition-colors relative ${
              showInventory ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Inventário da Casa"
          >
            <Package size={24} />
            {inventory.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {inventory.length}
              </span>
            )}
          </button>

          {/* Botão Modo Edição */}
          <button
            onClick={() => {
              onToggleEditMode?.();
              onSelectFurniture(null);
            }}
            className={`p-3 rounded-full transition-colors ${
              editMode ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Modo Edição"
          >
            <Edit3 size={24} />
          </button>

          {/* Botão Home */}
          <button
            onClick={() => {
              setShowCatalog(false);
              setShowInventory(false);
              onSelectFurniture(null);
            }}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
            title="Fechar Todos os Modais"
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
          title={
            <div className="flex justify-between items-center w-full">
              <span>Catálogo de Móveis</span>
              <button
                onClick={() => setShowAdminPanel(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors shadow-sm"
                title="Painel de Administração do Catálogo"
                style={{ display: isUserAdmin ? 'flex' : 'none' }}
              >
                ⚙️
              </button>
            </div>
          }
          onClose={() => {
            setShowCatalog(false);
            setSelectedCatalogItem(null);
            setExpandedSection(null);
          }}
          initialPosition={{ x: 100, y: 100 }}
          width="800px"
          height="600px"
        >
          <div className="flex h-full max-h-[500px]">
            {/* Lado esquerdo - Seções */}
            <div className="w-1/2 overflow-y-auto border-r border-gray-200 max-h-full">
              <div className="p-4 space-y-2">


                {/* Seções Customizadas */}
                {customSections.map((section) => (
                  <div key={section} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setExpandedSection(expandedSection === section ? null : section)}
                      className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-800 capitalize">
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </span>
                      <span className="text-gray-500">
                        {expandedSection === section ? '−' : '+'}
                      </span>
                    </button>

                    {expandedSection === section && (
                      <div className="border-t border-gray-200 p-4 max-h-60 overflow-y-auto">
                        {customSectionsFurniture[section]?.length > 0 ? (
                          <div className="grid grid-cols-6 gap-0.5">
                            {customSectionsFurniture[section].map((item, index) => (
                              <div
                                key={index}
                                onClick={() => setSelectedCatalogItem(item)}
                                className={`cursor-pointer transition-all aspect-square overflow-hidden rounded-lg ${
                                  selectedCatalogItem?.name === item.name && selectedCatalogItem?.model === item.model
                                    ? 'bg-blue-50 ring-2 ring-blue-500'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                {(item as any).isTexture ? (
                                  <TexturePreview
                                    textureData={item}
                                    width="100%"
                                    height="100%"
                                  />
                                ) : (
                                  <FurnitureThumbnail
                                    modelPath={item.model}
                                    width="100%"
                                    height="100%"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            <Package size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Nenhum móvel nesta seção</p>
                            <p className="text-xs">Adicione móveis usando o painel administrativo</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Lado direito - Detalhes do item */}
            <div className="w-1/2 p-6 flex flex-col">
              {selectedCatalogItem ? (
                <>
                  {/* Imagem grande */}
                  <div className="w-full h-48 rounded-lg mb-4 shadow-inner">
                    {(selectedCatalogItem as any).isTexture ? (
                      <TexturePreview
                        textureData={selectedCatalogItem}
                        width="100%"
                        height={192}
                      />
                    ) : (
                      <FurnitureThumbnail
                        modelPath={selectedCatalogItem.model}
                        width="100%"
                        height={192}
                      />
                    )}
                  </div>

                  {/* Detalhes */}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      {selectedCatalogItem.name}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {selectedCatalogItem.description}
                    </p>
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Categoria:</span>
                        <span className="capitalize font-medium">{selectedCatalogItem.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Preço:</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${selectedCatalogItem.price}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de compra */}
                  <button
                    onClick={() => handleBuy(selectedCatalogItem)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    {(selectedCatalogItem as any).isTexture ? 'Comprar Textura' : 'Comprar Móvel'}
                  </button>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Package size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Selecione um móvel para ver os detalhes</p>
                  </div>
                </div>
              )}
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
                <p className="text-sm">Compre m��veis no cat��logo!</p>
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-1 p-4">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(item, e)}
                    onDragEnd={handleDragEnd}
                    onContextMenu={(e) => handleContextMenu(e, item.id)}
                    className="hover:shadow-md hover:bg-gray-50 transition-all cursor-move aspect-square overflow-hidden rounded-lg relative"
                  >
                    {(item as any).isTexture ? (
                      <TexturePreview
                        textureData={item}
                        width="100%"
                        height="100%"
                      />
                    ) : (
                      <FurnitureThumbnail
                        modelPath={item.model}
                        width="100%"
                        height="100%"
                      />
                    )}
                    {/* Contador de quantidade */}
                    {item.quantity && item.quantity > 1 && (
                      <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                        {item.quantity > 99 ? "99+" : item.quantity}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SimpleModal>
      )}

      {/* Overlay de drag and drop */}
      {(draggedItem || draggedTexture) && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className={`text-white px-4 py-2 rounded-lg shadow-lg ${
            draggedTexture ? 'bg-purple-500' : 'bg-blue-500'
          }`}>
            {draggedTexture ?
              `Aplicando textura ${draggedTexture.name} - Clique na superfície correspondente` :
              `Colocando ${draggedItem?.name}...`
            }
          </div>
        </div>
      )}

      {/* Menu de Contexto */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[150px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            transform: 'translate(-50%, -10px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleInspectFurniture}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Package size={16} className="text-blue-500" />
            <span>Inspecionar</span>
          </button>
          <button
            onClick={handleDiscardFurniture}
            className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center space-x-2 text-red-600"
          >
            <Trash2 size={16} className="text-red-500" />
            <span>Descartar</span>
          </button>
        </div>
      )}

      {/* Painel Administrativo */}
      {isUserAdmin && (
        <FurnitureAdminPanel
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
          onAddFurniture={onAddFurniture}
          onAddTexture={(textureData) => {
            mockStorageService.addCustomTexture(textureData);
            console.log('Nova textura adicionada:', textureData);
            // Forçar re-render do catálogo
            setSectionsVersion(prev => prev + 1);
          }}
          onCreateSection={(sectionName) => {
            const success = mockStorageService.createCustomSection(sectionName);
            if (success) {
              console.log('Nova seção criada com sucesso:', sectionName);
              // Forçar re-render das seções
              setSectionsVersion(prev => prev + 1);
            }
            return success;
          }}
          onDeleteSection={(sectionName) => {
            const success = mockStorageService.deleteSection(sectionName);
            if (success) {
              console.log('Seção excluída com sucesso:', sectionName);
              // Forçar re-render das seções
              setSectionsVersion(prev => prev + 1);
              // Fechar seção expandida se foi a que foi excluída
              if (expandedSection === sectionName.toLowerCase()) {
                setExpandedSection(null);
              }
            }
            return success;
          }}
          onDeleteFurniture={(sectionName, furnitureIndex) => {
            const success = mockStorageService.deleteFurnitureFromSection(sectionName, furnitureIndex);
            if (success) {
              console.log('Móvel excluído com sucesso da seção:', sectionName);
              // Forçar re-render do catálogo
              setSectionsVersion(prev => prev + 1);
            }
            return success;
          }}
        />
      )}

      {/* Modal Adicionar Móvel (Admin) */}
      {isUserAdmin && (
        <AddFurnitureModal
          isOpen={showAddFurniture}
          onClose={() => setShowAddFurniture(false)}
          onAddFurniture={onAddFurniture || (() => {})}
          sectionsVersion={sectionsVersion}
        />
      )}
    </>
  );
};
