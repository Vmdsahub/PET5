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
    
    // Adicionar buracos para cada cutout
    relevantCutouts.forEach(cutout => {
      const [cutoutWidth, cutoutHeight] = cutout.size;
      const [furnitureX, furnitureY, furnitureZ] = cutout.position;

      // Calcular posição relativa do buraco na parede 2D
      let relativeX = 0;
      let relativeY = furnitureY - wallDimensions.position[1]; // Altura relativa

      // Determinar coordenada horizontal baseada na direção da parede
      switch (wallDirection) {
        case 'north':
        case 'south':
          relativeX = furnitureX; // Usar X como horizontal
          break;
        case 'east':
        case 'west':
          relativeX = furnitureZ; // Usar Z como horizontal
          break;
      }

      // Verificar se o buraco está dentro dos limites da parede
      const maxX = width / 2;
      const maxY = height / 2;

      if (Math.abs(relativeX) < maxX && Math.abs(relativeY) < maxY) {
        // Criar buraco retangular
        const hole = new THREE.Path();
        hole.moveTo(relativeX - cutoutWidth/2, relativeY - cutoutHeight/2);
        hole.lineTo(relativeX + cutoutWidth/2, relativeY - cutoutHeight/2);
        hole.lineTo(relativeX + cutoutWidth/2, relativeY + cutoutHeight/2);
        hole.lineTo(relativeX - cutoutWidth/2, relativeY + cutoutHeight/2);
        hole.closePath();

        wallShape.holes.push(hole);
      }
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
