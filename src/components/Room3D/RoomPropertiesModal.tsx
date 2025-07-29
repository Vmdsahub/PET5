import React, { useState, useEffect } from 'react';
import { X, Home, Settings } from 'lucide-react';
import { SimpleModal } from './SimpleModal';
import { mockStorageService, RoomDimensions } from '../../services/mockStorage';
import '../../styles/sliders.css';

interface RoomPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDimensionsUpdate?: (dimensions: RoomDimensions) => void;
}

export const RoomPropertiesModal: React.FC<RoomPropertiesModalProps> = ({
  isOpen,
  onClose,
  onDimensionsUpdate
}) => {
  const [dimensions, setDimensions] = useState<RoomDimensions>({
    length: 10,
    width: 10,
    height: 5,
    floorThickness: 0.2,
    wallThickness: 0.2,
    ceilingThickness: 0.2
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Carregar dimensões atuais quando modal abrir
  useEffect(() => {
    if (isOpen) {
      const currentDimensions = mockStorageService.getRoomDimensions();
      setDimensions(currentDimensions);
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof RoomDimensions, value: number) => {
    setDimensions(prev => {
      // Se alterou a espessura das paredes, sincronizar todas as espessuras
      if (field === 'wallThickness') {
        return {
          ...prev,
          wallThickness: value,
          floorThickness: value,
          ceilingThickness: value
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const success = mockStorageService.updateRoomDimensions(dimensions);
      
      if (success) {
        setSaveMessage('✅ Propriedades do quarto salvas com sucesso!');
        onDimensionsUpdate?.(dimensions);
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSaveMessage('❌ Erro: Valores fora dos limites permitidos.');
      }
    } catch (error) {
      console.error('Erro ao salvar propriedades:', error);
      setSaveMessage('❌ Erro interno ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultDimensions: RoomDimensions = {
      length: 10,
      width: 10,
      height: 5,
      floorThickness: 0.2,
      wallThickness: 0.2,
      ceilingThickness: 0.2
    };
    setDimensions(defaultDimensions);
  };

  if (!isOpen) return null;

  return (
    <SimpleModal
      title={
        <div className="flex items-center space-x-2">
          <Home className="w-4 h-4 text-blue-600" />
          <span>Propriedades do Quarto</span>
        </div>
      }
      onClose={onClose}
      initialPosition={{ x: 200, y: 50 }}
      width="380px"
      height="auto"
      maxHeight="90vh"
    >
      <div className="p-4 space-y-4">
        {/* Dimensões principais */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-800">Dimensões</h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Largura</label>
                <span className="text-sm font-bold text-blue-600">{dimensions.width}m</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="0.5"
                value={dimensions.width}
                onChange={(e) => handleInputChange('width', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Comprimento</label>
                <span className="text-sm font-bold text-blue-600">{dimensions.length}m</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                step="0.5"
                value={dimensions.length}
                onChange={(e) => handleInputChange('length', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Altura</label>
                <span className="text-sm font-bold text-blue-600">{dimensions.height}m</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                step="0.5"
                value={dimensions.height}
                onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
              />
            </div>
          </div>
        </div>

        {/* Espessuras */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Espessuras</h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Espessura do Chão
                </label>
                <span className="text-sm font-bold text-green-600">{dimensions.floorThickness}m</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={dimensions.floorThickness}
                onChange={(e) => handleInputChange('floorThickness', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.05m</span>
                <span>1m</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Espessura das Paredes
                </label>
                <span className="text-sm font-bold text-purple-600">{dimensions.wallThickness}m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={dimensions.wallThickness}
                onChange={(e) => handleInputChange('wallThickness', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.1m</span>
                <span>1m</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Espessura do Teto
                </label>
                <span className="text-sm font-bold text-orange-600">{dimensions.ceilingThickness}m</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={dimensions.ceilingThickness}
                onChange={(e) => handleInputChange('ceilingThickness', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.05m</span>
                <span>1m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem de status */}
        {saveMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            saveMessage.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Botões */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
          >
            Restaurar Padrão
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </div>
    </SimpleModal>
  );
};
