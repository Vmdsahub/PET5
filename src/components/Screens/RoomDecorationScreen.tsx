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
  Settings,
  Sun,
  Lightbulb,
} from "lucide-react";
import { motion } from "framer-motion";
import { RoomExperience } from "../../lib/room3d/RoomExperience";
import { useAuthStore } from "../../store/authStore";

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
  const [showLightingPanel, setShowLightingPanel] = useState(false);
  const [showGeometryPanel, setShowGeometryPanel] = useState(false);
  const [lightSettings, setLightSettings] = useState<any>({});
  const [roomDimensions, setRoomDimensions] = useState<any>({});
  const { user } = useAuthStore();

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
      // Load initial light settings and room dimensions for admin
      if (user?.isAdmin) {
        const lights = experienceRef.current.getAllLights();
        const dimensions = experienceRef.current.getRoomDimensions();
        setLightSettings(lights);
        setRoomDimensions(dimensions);
      }
    }
  }, [isEditMode, user?.isAdmin]);

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
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Canvas Container */}
      <div
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: isEditMode ? "crosshair" : "default" }}
      />

      {/* Vertical Navigation Pill */}
      <motion.div
        className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-yellow-50/95 backdrop-blur-md rounded-3xl p-3 shadow-2xl border-4 border-yellow-200/50 z-30"
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
          className="fixed top-20 right-4 bg-yellow-50/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-4 border-yellow-200/50 z-40"
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

      {/* Admin Lighting Panel */}
      {user?.isAdmin && (
        <motion.div
          className="fixed top-20 right-4 bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl border-4 border-slate-700/50 z-50 max-h-[80vh] overflow-y-auto"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          style={{
            background: "linear-gradient(145deg, #1e293b, #334155)",
            boxShadow:
              "0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowLightingPanel(!showLightingPanel)}
              className="flex items-center gap-2 text-white font-bold"
            >
              <Settings size={20} className="text-blue-400" />
              <span>🔧 Admin Controls</span>
            </button>
          </div>

          {showLightingPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 w-80"
            >
              {/* Time of Day Control */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Sun size={16} className="text-yellow-400" />
                  <span className="text-white font-medium">Time of Day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="1"
                  defaultValue="12"
                  onChange={(e) => {
                    if (experienceRef.current) {
                      experienceRef.current.setTimeOfDay(
                        parseInt(e.target.value),
                      );
                    }
                  }}
                  className="w-full slider"
                />
              </div>

              {/* Light Controls */}
              {Object.entries(lightSettings).map(
                ([lightName, settings]: [string, any]) => (
                  <div
                    key={lightName}
                    className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={16} className="text-yellow-400" />
                      <span className="text-white font-medium capitalize">
                        {lightName} Light
                      </span>
                    </div>

                    {/* Intensity Control */}
                    <div className="mb-3">
                      <label className="text-slate-300 text-xs block mb-1">
                        Intensity
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        defaultValue={settings.intensity}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateLightIntensity(
                              lightName,
                              parseFloat(e.target.value),
                            );
                          }
                        }}
                        className="w-full slider"
                      />
                    </div>

                    {/* Color Control */}
                    <div className="mb-3">
                      <label className="text-slate-300 text-xs block mb-1">
                        Color
                      </label>
                      <input
                        type="color"
                        defaultValue={settings.color}
                        onChange={(e) => {
                          if (experienceRef.current) {
                            experienceRef.current.updateLightColor(
                              lightName,
                              e.target.value,
                            );
                          }
                        }}
                        className="w-full h-8 rounded border border-slate-600 bg-slate-700"
                      />
                    </div>

                    {/* Shadow Toggle */}
                    <div>
                      <label className="flex items-center gap-2 text-slate-300 text-xs">
                        <input
                          type="checkbox"
                          defaultChecked={settings.castShadow}
                          onChange={(e) => {
                            if (experienceRef.current) {
                              experienceRef.current.updateShadowSettings(
                                lightName,
                                {
                                  enabled: e.target.checked,
                                },
                              );
                            }
                          }}
                          className="rounded"
                        />
                        Cast Shadows
                      </label>
                    </div>
                  </div>
                ),
              )}
            </motion.div>
          )}

          {showGeometryPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 w-80"
            >
              {/* Room Size Control */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-purple-400" />
                  <span className="text-white font-medium">
                    Room Size (Width/Length)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    defaultValue={roomDimensions.size || 20}
                    onChange={(e) => {
                      if (experienceRef.current) {
                        experienceRef.current.updateRoomSize(
                          parseInt(e.target.value),
                        );
                        setRoomDimensions((prev) => ({
                          ...prev,
                          size: parseInt(e.target.value),
                        }));
                      }
                    }}
                    className="flex-1 slider"
                  />
                  <span className="text-slate-300 text-sm min-w-[3rem]">
                    {roomDimensions.size || 20}m
                  </span>
                </div>
              </div>

              {/* Room Height Control */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-purple-400" />
                  <span className="text-white font-medium">Room Height</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="3"
                    max="20"
                    step="0.5"
                    defaultValue={roomDimensions.height || 10}
                    onChange={(e) => {
                      if (experienceRef.current) {
                        experienceRef.current.updateRoomHeight(
                          parseFloat(e.target.value),
                        );
                        setRoomDimensions((prev) => ({
                          ...prev,
                          height: parseFloat(e.target.value),
                        }));
                      }
                    }}
                    className="flex-1 slider"
                  />
                  <span className="text-slate-300 text-sm min-w-[3rem]">
                    {roomDimensions.height || 10}m
                  </span>
                </div>
              </div>

              {/* Wall Thickness Control */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-purple-400" />
                  <span className="text-white font-medium">Wall Thickness</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    defaultValue={roomDimensions.wallThickness || 0.2}
                    onChange={(e) => {
                      if (experienceRef.current) {
                        experienceRef.current.updateWallThickness(
                          parseFloat(e.target.value),
                        );
                        setRoomDimensions((prev) => ({
                          ...prev,
                          wallThickness: parseFloat(e.target.value),
                        }));
                      }
                    }}
                    className="flex-1 slider"
                  />
                  <span className="text-slate-300 text-sm min-w-[3rem]">
                    {(roomDimensions.wallThickness || 0.2).toFixed(2)}m
                  </span>
                </div>
              </div>

              {/* Floor Thickness Control */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-purple-400" />
                  <span className="text-white font-medium">
                    Floor Thickness
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    defaultValue={roomDimensions.floorThickness || 0.2}
                    onChange={(e) => {
                      if (experienceRef.current) {
                        experienceRef.current.updateFloorThickness(
                          parseFloat(e.target.value),
                        );
                        setRoomDimensions((prev) => ({
                          ...prev,
                          floorThickness: parseFloat(e.target.value),
                        }));
                      }
                    }}
                    className="flex-1 slider"
                  />
                  <span className="text-slate-300 text-sm min-w-[3rem]">
                    {(roomDimensions.floorThickness || 0.2).toFixed(2)}m
                  </span>
                </div>
              </div>

              {/* Ceiling Thickness Control */}
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-purple-400" />
                  <span className="text-white font-medium">
                    Ceiling Thickness
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    defaultValue={roomDimensions.ceilingThickness || 0.2}
                    onChange={(e) => {
                      if (experienceRef.current) {
                        experienceRef.current.updateCeilingThickness(
                          parseFloat(e.target.value),
                        );
                        setRoomDimensions((prev) => ({
                          ...prev,
                          ceilingThickness: parseFloat(e.target.value),
                        }));
                      }
                    }}
                    className="flex-1 slider"
                  />
                  <span className="text-slate-300 text-sm min-w-[3rem]">
                    {(roomDimensions.ceilingThickness || 0.2).toFixed(2)}m
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      {!isEditMode && (
        <motion.div
          className="fixed bottom-20 left-4 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 px-6 py-3 rounded-2xl text-sm font-medium border-2 border-yellow-200 z-40 max-w-xs"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1, type: "spring", bounce: 0.3 }}
          style={{
            boxShadow:
              "0 8px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
          }}
        >
          🖱️ Use o mouse para navegar pela casa • 🎨 Clique em Editar para
          decorar
        </motion.div>
      )}
    </div>
  );
};
