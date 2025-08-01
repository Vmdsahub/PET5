import React, { useMemo } from 'react';
import * as THREE from 'three';

interface WindowCutout {
  position: [number, number, number];
  wallDirection: 'north' | 'south' | 'east' | 'west';
  size: [number, number];
}

interface WallWithCutoutsProps {
  wallDirection: 'north' | 'south' | 'east' | 'west';
  wallDimensions: {
    width: number;
    height: number;
    thickness: number;
    position: [number, number, number];
    rotation: [number, number, number];
  };
  cutouts: WindowCutout[];
  material: THREE.Material;
  name: string;
  userData: any;
  wallRef?: React.RefObject<THREE.Mesh>;
}

export const WallWithCutouts: React.FC<WallWithCutoutsProps> = ({
  wallDirection,
  wallDimensions,
  cutouts,
  material,
  name,
  userData,
  wallRef
}) => {
  const geometry = useMemo(() => {
    const { width, height, thickness } = wallDimensions;
    
    // Filtrar cutouts relevantes para esta parede
    const relevantCutouts = cutouts.filter(cutout => cutout.wallDirection === wallDirection);

    console.log(`Wall ${wallDirection}: ${relevantCutouts.length} cutouts`);

    if (relevantCutouts.length === 0) {
      // Se não há cutouts, usar geometria simples
      return new THREE.BoxGeometry(width, height, thickness);
    }
    
    // Criar geometria com buracos usando CSG (Constructive Solid Geometry) básico
    const wallShape = new THREE.Shape();
    wallShape.moveTo(-width/2, -height/2);
    wallShape.lineTo(width/2, -height/2);
    wallShape.lineTo(width/2, height/2);
    wallShape.lineTo(-width/2, height/2);
    wallShape.closePath();
    
    // Adicionar buraco para cada cutout na posição exata
    relevantCutouts.forEach(cutout => {
      const [furnitureX, furnitureY, furnitureZ] = cutout.position;
      const cutoutSize = 1.2; // Tamanho um pouco maior que a janela

      // Calcular posição relativa do buraco na parede 2D
      let relativeX = 0;
      let relativeY = furnitureY - wallDimensions.position[1]; // Altura relativa

      // Coordenada horizontal EXATA baseada na parede
      switch (wallDirection) {
        case 'north':
        case 'south':
          relativeX = furnitureX; // Para paredes norte/sul, usar X
          break;
        case 'east':
        case 'west':
          relativeX = furnitureZ; // Para paredes leste/oeste, usar Z
          break;
      }

      // Criar buraco quadrado na posição EXATA
      const hole = new THREE.Path();
      const half = cutoutSize / 2;
      hole.moveTo(relativeX - half, relativeY - half);
      hole.lineTo(relativeX + half, relativeY - half);
      hole.lineTo(relativeX + half, relativeY + half);
      hole.lineTo(relativeX - half, relativeY + half);
      hole.closePath();

      wallShape.holes.push(hole);
    });
    
    // Criar geometria extrudada
    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings);
    
    // Centralizar a geometria
    geometry.translate(0, 0, -thickness/2);
    
    return geometry;
  }, [wallDimensions, cutouts, wallDirection]);
  
  return (
    <mesh
      ref={wallRef}
      position={wallDimensions.position}
      rotation={wallDimensions.rotation}
      geometry={geometry}
      material={material}
      name={name}
      userData={userData}
      receiveShadow={true}
      castShadow={true}
    />
  );
};
