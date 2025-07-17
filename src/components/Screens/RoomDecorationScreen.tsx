import React, { useEffect, useRef, useState } from "react";
import {
  Globe,
  Store,
  Home,
  Edit3,
  RotateCw,
  Move,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { RoomExperience } from "../../lib/room3d/RoomExperience";

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
  const [activeNav, setActiveNav] = useState("room");

  const navigationItems: NavigationItem[] = [
    { id: "globe", icon: <Globe size={24} />, label: "Explorar" },
    { id: "store", icon: <Store size={24} />, label: "Loja" },
    { id: "inventory", icon: <Home size={24} />, label: "Inventário" },
    {
      id: "edit",
      icon: <Edit3 size={24} />,
      label: "Editar",
      active: isEditMode,
    },
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
      case "globe":
        onNavigateBack();
        break;
      case "store":
        // TODO: Implement store navigation
        console.log("Navigate to store");
        break;
      case "inventory":
        // TODO: Implement inventory navigation
        console.log("Navigate to inventory");
        break;
      case "edit":
        setIsEditMode(!isEditMode);
        break;
    }
    setActiveNav(id);
  };

  const handleObjectTransform = (action: string) => {
    if (experienceRef.current && selectedObject) {
      switch (action) {
        case "rotate":
          experienceRef.current.rotateObject(selectedObject, Math.PI / 4);
          break;
        case "scale-up":
          experienceRef.current.scaleObject(selectedObject, 1.1);
          break;
        case "scale-down":
          experienceRef.current.scaleObject(selectedObject, 0.9);
          break;
      }
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-sky-200 via-green-200 to-yellow-100 overflow-hidden">
      {/* 3D Canvas Container */}
      <div
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: isEditMode ? "crosshair" : "default" }}
      />

      {/* Vertical Navigation Pill */}
      <motion.div
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-yellow-50/95 backdrop-blur-md rounded-3xl p-3 shadow-2xl border-4 border-yellow-200/50"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
        style={{
          background: "linear-gradient(145deg, #fefce8, #fef3c7)",
          boxShadow:
            "0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <div className="flex flex-col gap-3">
          {navigationItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`
                relative p-4 rounded-2xl transition-all duration-300 font-medium
                ${
                  item.active || activeNav === item.id
                    ? "bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg border-2 border-green-300"
                    : "bg-gradient-to-br from-white to-yellow-50 text-amber-700 hover:from-yellow-100 hover:to-yellow-200 hover:text-amber-800 border-2 border-yellow-200/50 hover:border-yellow-300"
                }
              `}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              title={item.label}
              style={{
                boxShadow:
                  item.active || activeNav === item.id
                    ? "0 8px 16px rgba(34, 197, 94, 0.3)"
                    : "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
            >
              {item.icon}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Edit Mode UI */}
      {isEditMode && (
        <motion.div
          className="absolute top-4 right-4 bg-yellow-50/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-4 border-yellow-200/50"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          style={{
            background: "linear-gradient(145deg, #fefce8, #fef3c7)",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Edit3 size={24} className="text-amber-600" />
            <span className="font-bold text-amber-800 text-lg">
              🏠 Modo Decoração
            </span>
          </div>

          {selectedObject ? (
            <div className="space-y-4">
              <div className="bg-white/60 rounded-2xl p-3 border-2 border-yellow-200">
                <p className="text-sm text-amber-700 mb-1 font-medium">
                  ����️ Móvel Selecionado:
                </p>
                <p className="font-bold text-amber-900 capitalize">
                  {selectedObject.replace(/-/g, " ")}
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={() => handleObjectTransform("rotate")}
                  className="p-3 bg-gradient-to-br from-purple-400 to-purple-500 text-white rounded-xl border-2 border-purple-300 font-medium shadow-lg"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  title="Girar"
                  style={{ boxShadow: "0 6px 12px rgba(168, 85, 247, 0.4)" }}
                >
                  <RotateCw size={18} />
                </motion.button>

                <motion.button
                  onClick={() => handleObjectTransform("scale-up")}
                  className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-xl border-2 border-emerald-300 font-medium shadow-lg"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  title="Aumentar"
                  style={{ boxShadow: "0 6px 12px rgba(16, 185, 129, 0.4)" }}
                >
                  <ZoomIn size={18} />
                </motion.button>

                <motion.button
                  onClick={() => handleObjectTransform("scale-down")}
                  className="p-3 bg-gradient-to-br from-red-400 to-red-500 text-white rounded-xl border-2 border-red-300 font-medium shadow-lg"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  title="Diminuir"
                  style={{ boxShadow: "0 6px 12px rgba(239, 68, 68, 0.4)" }}
                >
                  <ZoomOut size={18} />
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="bg-white/60 rounded-2xl p-4 border-2 border-yellow-200 text-center">
              <p className="text-amber-700 font-medium">
                🎯 Clique em um móvel para decorar!
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      {!isEditMode && (
        <motion.div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm"
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
