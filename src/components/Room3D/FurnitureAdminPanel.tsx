import React, { useState } from 'react';
import { Package, Plus, FolderPlus, Upload, Settings, Edit3, Trash2 } from 'lucide-react';
import { SimpleModal } from './SimpleModal';
import { mockStorageService } from '../../services/mockStorage';
import { AddFurnitureModal } from './AddFurnitureModal';
import { AddTextureModal } from './AddTextureModal';

interface FurnitureAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFurniture?: (furnitureData: any) => void;
  onAddTexture?: (textureData: any) => void;
  onCreateSection?: (sectionName: string) => boolean;
  onDeleteSection?: (sectionName: string) => boolean;
  onDeleteFurniture?: (sectionName: string, furnitureIndex: number) => boolean;
}

export const FurnitureAdminPanel: React.FC<FurnitureAdminPanelProps> = ({
  isOpen,
  onClose,
  onAddFurniture,
  onCreateSection,
  onDeleteSection,
  onDeleteFurniture
}) => {
  const [showAddFurniture, setShowAddFurniture] = useState(false);
  const [showAddTexture, setShowAddTexture] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [showDeleteFurniture, setShowDeleteFurniture] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedSectionToDelete, setSelectedSectionToDelete] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [sectionSuccess, setSectionSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  const handleCreateSection = () => {
    if (!newSectionName.trim()) {
      setSectionError('Nome da seção é obrigatório');
      return;
    }

    const success = onCreateSection?.(newSectionName.trim());

    if (success === false) {
      setSectionError('Esta seção já existe');
      setSectionSuccess('');
      return;
    }

    // Mostrar sucesso
    setSectionSuccess(`Seção "${newSectionName}" criada com sucesso! A página será recarregada.`);
    setSectionError('');

    // Reset form após um delay
    setTimeout(() => {
      setNewSectionName('');
      setSectionSuccess('');
      setShowCreateSection(false);
    }, 2000);
  };

  const handleCancelCreateSection = () => {
    setNewSectionName('');
    setSectionError('');
    setSectionSuccess('');
    setShowCreateSection(false);
  };

// Componente para excluir seções
const SectionDeleteForm: React.FC<{
  onDeleteSection?: (sectionName: string) => boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  deleteError: string;
  deleteSuccess: string;
}> = ({ onDeleteSection, onSuccess, onError, deleteError, deleteSuccess }) => {
  const [selectedSection, setSelectedSection] = useState('');

  // Obter todas as seções (básicas e customizadas)
  const allSections = mockStorageService.getAllSections();

  const handleDelete = () => {
    if (!selectedSection) {
      onError('Selecione uma seção para excluir');
      return;
    }

    const success = onDeleteSection?.(selectedSection);
    if (success) {
      onSuccess(`Seção "${selectedSection}" excluída com sucesso!`);
      setSelectedSection('');
    } else {
      onError('Erro ao excluir seção ou seção não encontrada');
    }
  };

  return (
    <div className="mt-3 p-2 bg-white rounded border">
      <select
        value={selectedSection}
        onChange={(e) => {
          setSelectedSection(e.target.value);
          onError('');
        }}
        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-red-500 focus:border-red-500 border-gray-300"
      >
        <option value="">Selecionar seção para excluir</option>
        {allSections.map((section: string) => (
          <option key={section} value={section}>
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </option>
        ))}
      </select>
      {deleteError && <p className="text-red-500 text-xs mt-1">{deleteError}</p>}
      {deleteSuccess && <p className="text-green-600 text-xs mt-1">{deleteSuccess}</p>}
      <div className="flex space-x-1 mt-2">
        <button
          onClick={handleDelete}
          disabled={!selectedSection}
          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-1 px-2 rounded text-xs transition-colors"
        >
          Excluir
        </button>
        <button
          onClick={() => setSelectedSection('')}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-2 rounded text-xs transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

// Componente para excluir móveis de uma seção
const FurnitureDeleteForm: React.FC<{
  onDeleteFurniture?: (sectionName: string, furnitureIndex: number) => boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  deleteError: string;
  deleteSuccess: string;
}> = ({ onDeleteFurniture, onSuccess, onError, deleteError, deleteSuccess }) => {
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedFurniture, setSelectedFurniture] = useState('');
  const [sectionFurniture, setSectionFurniture] = useState<any[]>([]);

  // Obter todas as seções
  const allSections = mockStorageService.getAllSections();

  // Atualizar móveis quando seção muda
  React.useEffect(() => {
    if (selectedSection) {
      const furniture = mockStorageService.getFurnitureBySection(selectedSection);
      setSectionFurniture(furniture);
      setSelectedFurniture('');
    } else {
      setSectionFurniture([]);
      setSelectedFurniture('');
    }
  }, [selectedSection]);

  const handleDelete = () => {
    if (!selectedSection) {
      onError('Selecione uma seção');
      return;
    }

    if (!selectedFurniture) {
      onError('Selecione um móvel para excluir');
      return;
    }

    const furnitureIndex = parseInt(selectedFurniture);
    const success = onDeleteFurniture?.(selectedSection, furnitureIndex);

    if (success) {
      const furnitureName = sectionFurniture[furnitureIndex]?.name || 'móvel';
      onSuccess(`Móvel "${furnitureName}" excluído com sucesso!`);
      setSelectedFurniture('');
      // Atualizar lista de móveis
      const updatedFurniture = mockStorageService.getFurnitureBySection(selectedSection);
      setSectionFurniture(updatedFurniture);
    } else {
      onError('Erro ao excluir móvel');
    }
  };

  return (
    <div className="mt-3 p-2 bg-white rounded border space-y-2">
      <select
        value={selectedSection}
        onChange={(e) => {
          setSelectedSection(e.target.value);
          onError('');
        }}
        className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 border-gray-300"
      >
        <option value="">Selecionar seção</option>
        {allSections.map((section: string) => (
          <option key={section} value={section}>
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </option>
        ))}
      </select>

      {selectedSection && (
        <select
          value={selectedFurniture}
          onChange={(e) => {
            setSelectedFurniture(e.target.value);
            onError('');
          }}
          className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500 border-gray-300"
        >
          <option value="">Selecionar móvel para excluir</option>
          {sectionFurniture.map((furniture, index) => (
            <option key={index} value={index}>
              {furniture.name}
            </option>
          ))}
        </select>
      )}

      {deleteError && <p className="text-red-500 text-xs mt-1">{deleteError}</p>}
      {deleteSuccess && <p className="text-green-600 text-xs mt-1">{deleteSuccess}</p>}

      <div className="flex space-x-1 mt-2">
        <button
          onClick={handleDelete}
          disabled={!selectedSection || !selectedFurniture}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-1 px-2 rounded text-xs transition-colors"
        >
          Excluir Móvel
        </button>
        <button
          onClick={() => {
            setSelectedSection('');
            setSelectedFurniture('');
          }}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-2 rounded text-xs transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

  if (!isOpen) return null;

  return (
    <>
      <SimpleModal
        title="Painel de Administração - Catálogo de Móveis"
        onClose={onClose}
        initialPosition={{ x: 150, y: 50 }}
        width="560px"
        height="auto"
        maxHeight="80vh"
      >
        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          <div className="text-center mb-4">
            <Package size={40} className="mx-auto mb-2 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-800">
              Gerenciar Catálogo de Móveis
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              Escolha uma função para administrar o catálogo
            </p>
          </div>

          {/* Botão Upload de Móvel GLB */}
          <button
            onClick={() => setShowAddFurniture(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <Upload size={20} />
            <div className="text-left">
              <div className="font-semibold text-sm">Fazer Upload de Móvel GLB</div>
              <div className="text-xs opacity-90">Adicionar novo modelo 3D ao catálogo</div>
            </div>
          </button>

          {/* Botão Upload de Textura */}
          <button
            onClick={() => setShowAddTexture(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <Settings size={20} />
            <div className="text-left">
              <div className="font-semibold text-sm">Adicionar Textura de Ambiente</div>
              <div className="text-xs opacity-90">Texturas para chão, parede e teto</div>
            </div>
          </button>

          {/* Gerenciar Seções */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-3">
              <FolderPlus size={18} className="text-green-600" />
              <h3 className="font-medium text-green-800 text-sm">Gerenciar Seções</h3>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {/* Criar Nova Seção */}
              <button
                onClick={() => {
                  setShowCreateSection(!showCreateSection);
                  setShowDeleteSection(false);
                  setShowDeleteFurniture(false);
                  setSectionError('');
                  setSectionSuccess('');
                }}
                className={`py-2 px-2 rounded text-xs font-medium transition-colors ${
                  showCreateSection
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                + Nova
              </button>

              {/* Excluir Seção */}
              <button
                onClick={() => {
                  setShowDeleteSection(!showDeleteSection);
                  setShowCreateSection(false);
                  setShowDeleteFurniture(false);
                  setDeleteError('');
                  setDeleteSuccess('');
                }}
                className={`py-2 px-2 rounded text-xs font-medium transition-colors ${
                  showDeleteSection
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                − Seção
              </button>

              {/* Excluir Móvel */}
              <button
                onClick={() => {
                  setShowDeleteFurniture(!showDeleteFurniture);
                  setShowCreateSection(false);
                  setShowDeleteSection(false);
                  setDeleteError('');
                  setDeleteSuccess('');
                }}
                className={`py-2 px-2 rounded text-xs font-medium transition-colors ${
                  showDeleteFurniture
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                − Móvel
              </button>
            </div>

            {/* Formulário Criar Seção */}
            {showCreateSection && (
              <div className="mt-3 p-2 bg-white rounded border">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => {
                    setNewSectionName(e.target.value);
                    setSectionError('');
                    setSectionSuccess('');
                  }}
                  className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 ${
                    sectionError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nome da nova seção"
                />
                {sectionError && <p className="text-red-500 text-xs mt-1">{sectionError}</p>}
                {sectionSuccess && <p className="text-green-600 text-xs mt-1">{sectionSuccess}</p>}
                <div className="flex space-x-1 mt-2">
                  <button
                    onClick={handleCreateSection}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded text-xs transition-colors"
                  >
                    Criar
                  </button>
                  <button
                    onClick={handleCancelCreateSection}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-1 px-2 rounded text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Formulário Excluir Seção */}
            {showDeleteSection && (
              <SectionDeleteForm
                onDeleteSection={onDeleteSection}
                onSuccess={(message) => {
                  setDeleteSuccess(message);
                  setDeleteError('');
                  setTimeout(() => setDeleteSuccess(''), 3000);
                }}
                onError={(message) => {
                  setDeleteError(message);
                  setDeleteSuccess('');
                }}
                deleteError={deleteError}
                deleteSuccess={deleteSuccess}
              />
            )}

            {/* Formulário Excluir Móvel */}
            {showDeleteFurniture && (
              <FurnitureDeleteForm
                onDeleteFurniture={onDeleteFurniture}
                onSuccess={(message) => {
                  setDeleteSuccess(message);
                  setDeleteError('');
                  setTimeout(() => setDeleteSuccess(''), 3000);
                }}
                onError={(message) => {
                  setDeleteError(message);
                  setDeleteSuccess('');
                }}
                deleteError={deleteError}
                deleteSuccess={deleteSuccess}
              />
            )}
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
