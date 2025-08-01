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
  const [positionY, setPositionY] = useState(furniture.position?.[1] || 0);
  const [screenPosition, setScreenPosition] = useState({ x: 100, y: 100 });
  const animationFrameRef = useRef<number>();

  // Update local state when furniture changes
  useEffect(() => {
    setScaleX(furniture.scale?.[0] || 1);
    setScaleY(furniture.scale?.[1] || 1);
    setScaleZ(furniture.scale?.[2] || 1);
    setPositionY(furniture.position?.[1] || 0);
  }, [furniture.id, furniture.scale, furniture.position]);

  // Calculate screen position based on 3D position
  useEffect(() => {
    const updateScreenPosition = () => {
      if (!meshRef.current || !camera) return;

      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const worldPosition = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPosition);

      // Project 3D position to 2D screen coordinates
      const vector = worldPosition.clone();
      vector.project(camera);

      const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
      const y = (vector.y * -0.5 + 0.5) * rect.height + rect.top;

      // Position controls to the left of the furniture with some offset
      setScreenPosition({
        x: Math.max(x - 150, 100), // Offset to the left, but stay in screen
        y: Math.max(y - 80, 50) // Offset up a bit, but stay in screen
      });
    };

    const animate = () => {
      updateScreenPosition();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (visible && meshRef.current && camera) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visible, meshRef, camera]);

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

  const updatePositionY = (value: number) => {
    if (!meshRef.current) return;

    setPositionY(value);
    meshRef.current.position.y = value;

    if (onUpdateTransform) {
      const position = meshRef.current.position;
      const rotation = meshRef.current.rotation;
      const scale = meshRef.current.scale;
      onUpdateTransform(furniture.id,
        [position.x, value, position.z],
        [rotation.x, rotation.y, rotation.z],
        [scale.x, scale.y, scale.z]
      );
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        left: `${screenPosition.x}px`,
        top: `${screenPosition.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="flex gap-4 items-center">
        {/* Controles de Posição Y */}
        <div className="flex flex-col items-center">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startPos = positionY;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaY = (startY - moveEvent.clientY) * 0.01;
                updatePositionY(Math.max(-2, Math.min(5, startPos + deltaY)));
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
            className="bg-white/80 hover:bg-white text-gray-800 w-6 h-12 rounded flex flex-col items-center justify-center text-xs cursor-ns-resize border border-gray-300 shadow-sm"
            title="Arraste para ajustar altura"
          >
            <span className="text-xs mb-1">▲</span>
            <span className="text-xs font-bold">{positionY.toFixed(1)}</span>
            <span className="text-xs mt-1">▼</span>
          </button>
        </div>

        {/* Slider X */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-blue-400 mb-1 font-bold bg-black/60 px-1.5 py-0.5 rounded">X</div>
          <div className="relative h-16 w-3">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scaleX}
              onChange={(e) => updateScale('x', parseFloat(e.target.value))}
              className="slider-vertical h-full w-full appearance-none bg-blue-400/40 rounded-full outline-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
          </div>
          <div className="text-xs text-white font-medium mt-1 bg-black/60 px-1 py-0.5 rounded">{scaleX.toFixed(1)}</div>
        </div>

        {/* Slider Y */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-red-400 mb-1 font-bold bg-black/60 px-1.5 py-0.5 rounded">Y</div>
          <div className="relative h-16 w-3">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scaleY}
              onChange={(e) => updateScale('y', parseFloat(e.target.value))}
              className="slider-vertical h-full w-full appearance-none bg-red-400/40 rounded-full outline-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
          </div>
          <div className="text-xs text-white font-medium mt-1 bg-black/60 px-1 py-0.5 rounded">{scaleY.toFixed(1)}</div>
        </div>

        {/* Slider Z */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-green-400 mb-1 font-bold bg-black/60 px-1.5 py-0.5 rounded">Z</div>
          <div className="relative h-16 w-3">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scaleZ}
              onChange={(e) => updateScale('z', parseFloat(e.target.value))}
              className="slider-vertical h-full w-full appearance-none bg-green-400/40 rounded-full outline-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
          </div>
          <div className="text-xs text-white font-medium mt-1 bg-black/60 px-1 py-0.5 rounded">{scaleZ.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
};
