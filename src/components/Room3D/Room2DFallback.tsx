import React, { useState } from 'react';
import { FurnitureItem } from '../../services/mockStorage';
import { Sofa, Table, Bed, BookOpen, Lamp, Trees, Tv, UtensilsIcon } from 'lucide-react';

interface Room2DFallbackProps {
  placedFurniture: FurnitureItem[];
  selectedFurniture: string | null;
  onSelectFurniture: (id: string | null) => void;
  onMoveFurniture: (id: string, position: [number, number, number]) => void;
}

const getFurnitureIcon = (category: string) => {
  switch (category) {
    case 'sala':
      return <Sofa size={24} />;
    case 'quarto':
      return <Bed size={24} />;
    case 'cozinha':
      return <UtensilsIcon size={24} />;
    case 'decoração':
      return <Trees size={24} />;
    case 'iluminação':
      return <Lamp size={24} />;
    default:
      return <Table size={24} />;
  }
};

export const Room2DFallback: React.FC<Room2DFallbackProps> = ({
  placedFurniture,
  selectedFurniture,
  onSelectFurniture,
  onMoveFurniture
}) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleMouseDown = (furnitureId: string, event: React.MouseEvent) => {
    event.preventDefault();
    onSelectFurniture(furnitureId);
    setDraggedItem(furnitureId);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggedItem) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const z = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    
    onMoveFurniture(draggedItem, [x, 0.5, z]);
  };

  const handleMouseUp = () => {
    setDraggedItem(null);
  };

  return (
    <div className="w-full h-full relative" style={{
      background: `
        radial-gradient(ellipse at 20% 30%, rgba(50, 80, 150, 0.4) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(70, 120, 180, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 40% 80%, rgba(60, 100, 160, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 70% 70%, rgba(40, 90, 140, 0.2) 0%, transparent 50%),
        linear-gradient(135deg, #1a2845 0%, #0f1c38 40%, #0a1228 70%, #050a18 100%)
      `
    }}>
      {/* Room representation */}
      <div 
        className="w-full h-full relative overflow-hidden cursor-move"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Room borders */}
        <div className="absolute inset-4 border-4 border-gray-300 bg-gray-100 rounded-lg shadow-inner">
          {/* Floor pattern */}
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 relative">
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(139, 69, 19, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(139, 69, 19, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />
            
            {/* Furniture items */}
            {placedFurniture.map((furniture) => {
              const x = ((furniture.position[0] + 5) / 10) * 100;
              const y = ((furniture.position[2] + 5) / 10) * 100;
              
              return (
                <div
                  key={furniture.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move transition-all duration-200 ${
                    selectedFurniture === furniture.id 
                      ? 'scale-110 z-10' 
                      : 'z-5'
                  }`}
                  style={{
                    left: `${Math.max(5, Math.min(95, x))}%`,
                    top: `${Math.max(5, Math.min(95, y))}%`,
                  }}
                  onMouseDown={(e) => handleMouseDown(furniture.id, e)}
                  title={furniture.name}
                >
                  <div 
                    className={`p-3 rounded-lg shadow-lg border-2 transition-all ${
                      selectedFurniture === furniture.id
                        ? 'bg-blue-200 border-blue-500 ring-2 ring-blue-300'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-gray-600">
                      {getFurnitureIcon(furniture.category)}
                    </div>
                  </div>
                  {selectedFurniture === furniture.id && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {furniture.name}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Room entrance */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-amber-300 border-t-2 border-amber-600">
              <div className="text-center text-xs text-amber-800 mt-1">Entrada</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg max-w-xs">
        <div className="text-sm text-gray-700">
          <div className="font-semibold mb-1">💡 Modo 2D Ativo</div>
          <div className="text-xs space-y-1">
            <div>• Clique nos móveis para selecioná-los</div>
            <div>• Arraste para mover pela sala</div>
            <div>• Use o menu lateral para adicionar móveis</div>
          </div>
        </div>
      </div>
    </div>
  );
};
