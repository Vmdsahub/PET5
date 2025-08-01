import React, { useState, useEffect } from 'react';
import { X, Home, Settings, Lightbulb } from 'lucide-react';
import { SimpleModal } from './SimpleModal';
import { mockStorageService, RoomDimensions } from '../../services/mockStorage';
import { LightingControls, LightingSettings } from './LightingControls';
import '../../styles/sliders.css';

interface RoomPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDimensionsUpdate?: (dimensions: RoomDimensions) => void;
  lightingSettings?: LightingSettings;
  onLightingChange?: (settings: LightingSettings) => void;
  isAdmin?: boolean;
  onShowLightHelpers?: (show: boolean) => void;
  showLightHelpers?: boolean;
}

export const RoomPropertiesModal: React.FC<RoomPropertiesModalProps> = ({
  isOpen,
  onClose,
  onDimensionsUpdate,
  lightingSettings,
  onLightingChange
}) => {
  const [activeTab, setActiveTab] = useState<'dimensions' | 'lighting'>('dimensions');
  const [dimensions, setDimensions] = useState<RoomDimensions>({
    length: 10,
    width: 10,
    height: 5,
    floorThickness: 0.2,
    wallThickness: 0.2,
    ceilingThickness: 0.2
  });


  // Carregar dimensões atuais quando modal abrir
  useEffect(() => {
    if (isOpen) {
      const currentDimensions = mockStorageService.getRoomDimensions();
      setDimensions(currentDimensions);
    }
  }, [isOpen]);

  // Cleanup do debounce
  useEffect(() => {
    return () => {
      if (debouncedUpdate.current) {
        clearTimeout(debouncedUpdate.current);
      }
    };
  }, []);

  // Debounce para evitar atualizações excessivas
  const debouncedUpdate = React.useRef<NodeJS.Timeout>();

  const handleInputChange = (field: keyof RoomDimensions, value: number) => {
    const newDimensions = {
      ...dimensions,
      [field]: value
    };
    setDimensions(newDimensions);

    // Limpar timeout anterior
    if (debouncedUpdate.current) {
      clearTimeout(debouncedUpdate.current);
    }

    // Atualizar com debounce para evitar travamentos
    debouncedUpdate.current = setTimeout(() => {
      requestAnimationFrame(() => {
        mockStorageService.updateRoomDimensions(newDimensions);
        onDimensionsUpdate?.(newDimensions);
      });
    }, 150);
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

    // Aplicar valores padrão em tempo real
    mockStorageService.updateRoomDimensions(defaultDimensions);
    onDimensionsUpdate?.(defaultDimensions);
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
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('dimensions')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dimensions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Dimensões</span>
          </button>
          <button
            onClick={() => setActiveTab('lighting')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'lighting'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Iluminação</span>
          </button>
        </div>

        {/* Conteúdo das tabs */}
        {activeTab === 'dimensions' && (
          <>
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
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
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
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
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
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
              />
            </div>
          </div>
        </div>

        {/* Espessuras individuais */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-800">Espessuras</h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Chão</label>
                <span className="text-sm font-bold text-green-600">{dimensions.floorThickness}m</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={dimensions.floorThickness}
                onChange={(e) => handleInputChange('floorThickness', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Paredes</label>
                <span className="text-sm font-bold text-purple-600">{dimensions.wallThickness}m</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={dimensions.wallThickness}
                onChange={(e) => handleInputChange('wallThickness', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Teto</label>
                <span className="text-sm font-bold text-orange-600">{dimensions.ceilingThickness}m</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={dimensions.ceilingThickness}
                onChange={(e) => handleInputChange('ceilingThickness', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
              />
            </div>
          </div>
        </div>

            {/* Botões */}
            <div className="flex space-x-2 pt-3 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm transition-colors"
              >
                Padrão
              </button>

              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
              >
                Fechar
              </button>
            </div>
          </>
        )}

        {/* Tab de Iluminação */}
        {activeTab === 'lighting' && lightingSettings && onLightingChange && (
          <LightingControls
            settings={lightingSettings}
            onChange={onLightingChange}
          />
        )}
      </div>
    </SimpleModal>
  );
};
