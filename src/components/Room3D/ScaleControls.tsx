import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FurnitureItem } from '../../services/mockStorage';

interface ScaleControlsProps {
  furniture: FurnitureItem;
  meshRef: React.RefObject<THREE.Group>;
  onUpdateTransform?: (id: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void;
  onUpdateCatalogItem?: (furnitureId: string, newScale: [number, number, number]) => void;
  isAdmin?: boolean;
  visible: boolean;
  camera?: THREE.Camera;
}

export const ScaleControls: React.FC<ScaleControlsProps> = ({
  furniture,
  meshRef,
  onUpdateTransform,
  onUpdateCatalogItem,
  isAdmin,
  visible,
  camera
}) => {
  const [scaleX, setScaleX] = useState(furniture.scale?.[0] || 1);
  const [scaleY, setScaleY] = useState(furniture.scale?.[1] || 1);
  const [scaleZ, setScaleZ] = useState(furniture.scale?.[2] || 1);
  const [screenPosition, setScreenPosition] = useState({ x: 100, y: 100 });
  const animationFrameRef = useRef<number>();

  // Update local state when furniture changes
  useEffect(() => {
    setScaleX(furniture.scale?.[0] || 1);
    setScaleY(furniture.scale?.[1] || 1);
    setScaleZ(furniture.scale?.[2] || 1);
  }, [furniture.id, furniture.scale]);

  const updateScale = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!meshRef.current) return;

    const newScale = {
      x: axis === 'x' ? value : scaleX,
      y: axis === 'y' ? value : scaleY,
      z: axis === 'z' ? value : scaleZ
    };

    setScaleX(newScale.x);
    setScaleY(newScale.y);
    setScaleZ(newScale.z);

    meshRef.current.scale.set(newScale.x, newScale.y, newScale.z);

    if (onUpdateTransform) {
      const position = meshRef.current.position;
      const rotation = meshRef.current.rotation;
      onUpdateTransform(furniture.id,
        [position.x, position.y, position.z],
        [rotation.x, rotation.y, rotation.z],
        [newScale.x, newScale.y, newScale.z]
      );
    }

    if (isAdmin && onUpdateCatalogItem) {
      onUpdateCatalogItem(furniture.id, [newScale.x, newScale.y, newScale.z]);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm p-4 rounded-lg border border-white/20 z-50">
      <div className="text-white text-sm mb-3 font-medium">Escala do Móvel</div>
      <div className="flex gap-6">
        {/* Slider X */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-blue-400 mb-2 font-medium">X</div>
          <div className="relative h-32 w-6">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scaleX}
              onChange={(e) => updateScale('x', parseFloat(e.target.value))}
              className="slider-vertical h-full w-full appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
          </div>
          <div className="text-xs text-white/70 mt-2">{scaleX.toFixed(1)}</div>
        </div>

        {/* Slider Y */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-red-400 mb-2 font-medium">Y</div>
          <div className="relative h-32 w-6">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scaleY}
              onChange={(e) => updateScale('y', parseFloat(e.target.value))}
              className="slider-vertical h-full w-full appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
          </div>
          <div className="text-xs text-white/70 mt-2">{scaleY.toFixed(1)}</div>
        </div>

        {/* Slider Z */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-green-400 mb-2 font-medium">Z</div>
          <div className="relative h-32 w-6">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scaleZ}
              onChange={(e) => updateScale('z', parseFloat(e.target.value))}
              className="slider-vertical h-full w-full appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
          </div>
          <div className="text-xs text-white/70 mt-2">{scaleZ.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
};
