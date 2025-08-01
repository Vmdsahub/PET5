import React from 'react';
import * as THREE from 'three';

interface WindowCutoutProps {
  position: [number, number, number];
  wallDirection: 'north' | 'south' | 'east' | 'west';
  size: [number, number]; // [width, height]
}

export const WindowCutout: React.FC<WindowCutoutProps> = ({
  position,
  wallDirection,
  size
}) => {
  const [width, height] = size;
  
  // Calcular posição e rotação baseado na direção da parede
  const getCutoutTransform = () => {
    const wallThickness = 0.25; // Espessura ligeiramente maior que a parede para garantir corte
    
    switch (wallDirection) {
      case 'north':
        return {
          position: [position[0], position[1], position[2] + wallThickness/2] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number]
        };
      case 'south':
        return {
          position: [position[0], position[1], position[2] - wallThickness/2] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number]
        };
      case 'east':
        return {
          position: [position[0] - wallThickness/2, position[1], position[2]] as [number, number, number],
          rotation: [0, Math.PI/2, 0] as [number, number, number]
        };
      case 'west':
        return {
          position: [position[0] + wallThickness/2, position[1], position[2]] as [number, number, number],
          rotation: [0, Math.PI/2, 0] as [number, number, number]
        };
      default:
        return {
          position: position,
          rotation: [0, 0, 0] as [number, number, number]
        };
    }
  };

  const { position: cutoutPosition, rotation } = getCutoutTransform();

  return (
    <mesh
      position={cutoutPosition}
      rotation={rotation}
      userData={{ isWindowCutout: true }}
    >
      {/* Geometria do buraco - um pouco maior que o móvel para garantir o corte */}
      <boxGeometry args={[width * 1.1, height * 1.1, 0.25]} />
      {/* Material invisível que subtrai da parede */}
      <meshBasicMaterial 
        color="#000000" 
        transparent 
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
