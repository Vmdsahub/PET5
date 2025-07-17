import React, { useEffect, useRef, useState } from 'react';
import { Globe, Store, Home, Edit3, RotateCw, Move, ZoomIn, ZoomOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { RoomExperience } from '../../lib/room3d/RoomExperience';

interface RoomDecorationScreenProps {
  onNavigateBack: () => void;
}

interface NavigationItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

export const RoomDecorationScreen: React.FC<RoomDecorationScreenProps> = ({
  onNavigateBack,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<RoomExperience | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('room');

  const navigationItems: NavigationItem[] = [
    { id: 'globe', icon: <Globe size={24} />, label: 'Explorar' },
    { id: 'store', icon: <Store size={24} />, label: 'Loja' },
    { id: 'inventory', icon: <Home size={24} />, label: 'Inventário' },
    { id: 'edit', icon: <Edit3 size={24} />, label: 'Editar', active: isEditMode },
  ];

  useEffect(() => {
    if (canvasRef.current && !experienceRef.current) {
      experienceRef.current = new RoomExperience({
        targetElement: canvasRef.current,
        onObjectSelect: (objectId: string | null) => {
          setSelectedObject(objectId);
        },
        editMode: isEditMode,
      });
    }

    return () => {
      if (experienceRef.current) {
        experienceRef.current.destroy();
        experienceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (experienceRef.current) {
      experienceRef.current.setEditMode(isEditMode);
    }
  }, [isEditMode]);

  const handleNavigation = (id: string) => {
    switch (id) {
      case 'globe':
        onNavigateBack();
        break;
      case 'store':
        // TODO: Implement store navigation
        console.log('Navigate to store');
        break;
      case 'inventory':
        // TODO: Implement inventory navigation
        console.log('Navigate to inventory');
        break;
      case 'edit':
        setIsEditMode(!isEditMode);
        break;
    }
    setActiveNav(id);
  };

  const handleObjectTransform = (action: string) => {
    if (experienceRef.current && selectedObject) {
      switch (action) {
        case 'rotate':
          experienceRef.current.rotateObject(selectedObject, Math.PI / 4);
          break;
        case 'scale-up':
          experienceRef.current.scaleObject(selectedObject, 1.1);
          break;
        case 'scale-down':
          experienceRef.current.scaleObject(selectedObject, 0.9);
          break;
      }
    }
  };

  return (
    <div className=\"relative w-full h-screen bg-gradient-to-b from-blue-100 to-green-100 overflow-hidden\">
      {/* 3D Canvas Container */}
      <div 
        ref={canvasRef} 
        className=\"w-full h-full\"
        style={{ cursor: isEditMode ? 'crosshair' : 'default' }}
      />

      {/* Vertical Navigation Pill */}
      <motion.div
        className=\"absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-white/20\"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className=\"flex flex-col gap-2\">
          {navigationItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`
                relative p-3 rounded-xl transition-all duration-200
                ${item.active || activeNav === item.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80 hover:text-blue-500'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={item.label}
            >
              {item.icon}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Edit Mode UI */}
      {isEditMode && (
        <motion.div
          className=\"absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/20\"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className=\"flex items-center gap-2 mb-3\">
            <Edit3 size={20} className=\"text-blue-500\" />
            <span className=\"font-medium text-gray-800\">Modo Edição</span>
          </div>
          
          {selectedObject ? (
            <div className=\"space-y-2\">
              <p className=\"text-sm text-gray-600 mb-3\">
                Objeto selecionado: <span className=\"font-medium\">{selectedObject}</span>
              </p>
              
              <div className=\"flex gap-2\">
                <motion.button
                  onClick={() => handleObjectTransform('rotate')}
                  className=\"p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors\"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title=\"Girar\"
                >
                  <RotateCw size={16} />
                </motion.button>
                
                <motion.button
                  onClick={() => handleObjectTransform('scale-up')}
                  className=\"p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors\"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title=\"Aumentar\"
                >
                  <ZoomIn size={16} />
                </motion.button>
                
                <motion.button
                  onClick={() => handleObjectTransform('scale-down')}
                  className=\"p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors\"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title=\"Diminuir\"
                >
                  <ZoomOut size={16} />
                </motion.button>
              </div>
            </div>
          ) : (
            <p className=\"text-sm text-gray-500\">
              Clique em um móvel para editá-lo
            </p>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      {!isEditMode && (
        <motion.div
          className=\"absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm\"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          Use o mouse para navegar pela casa • Clique em Editar para decorar
        </motion.div>
      )}
    </div>
  );
};