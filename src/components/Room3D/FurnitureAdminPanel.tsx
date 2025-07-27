import React, { useState } from 'react';
import { Package, Plus, FolderPlus, Upload, Settings, Edit3 } from 'lucide-react';
import { SimpleModal } from './SimpleModal';
import { AddFurnitureModal } from './AddFurnitureModal';

interface FurnitureAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFurniture?: (furnitureData: any) => void;
  onCreateSection?: (sectionName: string) => void;
}

export const FurnitureAdminPanel: React.FC<FurnitureAdminPanelProps> = ({
  isOpen,
  onClose,
  onAddFurniture,
  onCreateSection
}) => {
  const [showAddFurniture, setShowAddFurniture] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionError, setSectionError] = useState('');

  const handleCreateSection = () => {
    if (!newSectionName.trim()) {
      setSectionError('Nome da seção é obrigatório');
      return;
    }

    if (onCreateSection) {
      onCreateSection(newSectionName.trim());
    }
    
    // Reset form
    setNewSectionName('');
    setSectionError('');
    setShowCreateSection(false);
  };

  const handleCancelCreateSection = () => {
    setNewSectionName('');
    setSectionError('');
    setShowCreateSection(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <SimpleModal
        title="Painel de Administração - Catálogo de Móveis"
        onClose={onClose}
        initialPosition={{ x: 150, y: 50 }}
        width="500px"
        height="400px"
      >
        <div className="p-6 space-y-4">
          <div className="text-center mb-6">
            <Package size={48} className="mx-auto mb-3 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">
              Gerenciar Catálogo de Móveis
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Escolha uma função para administrar o catálogo
            </p>
          </div>

          {/* Botão Upload de Móvel GLB */}
          <button
            onClick={() => setShowAddFurniture(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <Upload size={24} />
            <div className="text-left">
              <div className="font-semibold">Fazer Upload de Móvel GLB</div>
              <div className="text-xs opacity-90">Adicionar novo modelo 3D ao catálogo</div>
            </div>
          </button>

          {/* Botão Criar Nova Seção */}
          {!showCreateSection ? (
            <button
              onClick={() => setShowCreateSection(true)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
            >
              <FolderPlus size={24} />
              <div className="text-left">
                <div className="font-semibold">Adicionar Nova Seção</div>
                <div className="text-xs opacity-90">Criar categoria personalizada de móveis</div>
              </div>
            </button>
          ) : (
            /* Formulário para criar nova seção */
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 mb-3">
                <FolderPlus size={20} className="text-green-600" />
                <h3 className="font-medium text-green-800">Nova Seção do Catálogo</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Seção
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => {
                    setNewSectionName(e.target.value);
                    setSectionError('');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    sectionError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Móveis de Escritório, Decoração Premium..."
                />
                {sectionError && <p className="text-red-500 text-xs mt-1">{sectionError}</p>}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={handleCreateSection}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Criar Seção
                </button>
                <button
                  onClick={handleCancelCreateSection}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Botão Gerenciar Móveis Existentes */}
          <button
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <Package size={24} />
            <div className="text-left">
              <div className="font-semibold">Gerenciar Móveis Existentes</div>
              <div className="text-xs opacity-90">Editar, remover e organizar móveis</div>
            </div>
          </button>

          {/* Informação sobre as funções */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Informações:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Upload GLB: Adiciona novos modelos 3D ao catálogo</li>
              <li>• Nova Seção: Cria categorias personalizadas</li>
              <li>• Gerenciar: Edita móveis já cadastrados</li>
            </ul>
          </div>
        </div>
      </SimpleModal>

      {/* Modal de adicionar móvel */}
      <AddFurnitureModal
        isOpen={showAddFurniture}
        onClose={() => setShowAddFurniture(false)}
        onAddFurniture={onAddFurniture || (() => {})}
      />
    </>
  );
};
