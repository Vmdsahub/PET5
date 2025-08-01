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
    console.log(`\n=== WALL ${wallDirection.toUpperCase()} PROCESSING ===`);
    console.log(`Total cutouts received:`, cutouts.length);
    cutouts.forEach((cutout, i) => {
      console.log(`Cutout ${i}: wallDirection="${cutout.wallDirection}", should match "${wallDirection}": ${cutout.wallDirection === wallDirection}`);
    });

    const relevantCutouts = cutouts.filter(cutout => {
      const matches = cutout.wallDirection === wallDirection;
      console.log(`Filtering cutout with wallDirection="${cutout.wallDirection}" for wall "${wallDirection}": ${matches}`);
      return matches;
    });

    console.log(`Wall ${wallDirection}: ${relevantCutouts.length} relevant cutouts out of ${cutouts.length} total`);

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
    
    // Adicionar buraco para cada cutout na posição EXATA
    relevantCutouts.forEach(cutout => {
      const [furnitureX, furnitureY, furnitureZ] = cutout.position;
      const cutoutSize = 1.2;

      // Calcular posição relativa do buraco na parede 2D
      let relativeX = 0;
      let relativeY = furnitureY - wallDimensions.position[1];

      // DEBUG: Log para verificar coordenadas
      console.log(`Creating cutout for ${wallDirection}: furniture at [${furnitureX.toFixed(1)}, ${furnitureY.toFixed(1)}, ${furnitureZ.toFixed(1)}]`);

      // Coordenada horizontal baseada na orientação da parede
      if (wallDirection === 'north' || wallDirection === 'south') {
        // Paredes horizontais - usar X como coordenada horizontal
        relativeX = furnitureX;
        console.log(`Horizontal wall: using X=${furnitureX.toFixed(1)} as relativeX`);
      } else {
        // Paredes verticais (east/west) - usar Z como coordenada horizontal
        relativeX = furnitureZ;
        console.log(`Vertical wall: using Z=${furnitureZ.toFixed(1)} as relativeX`);
      }

      console.log(`Final cutout position: [${relativeX.toFixed(1)}, ${relativeY.toFixed(1)}] on wall ${wallDirection}`);

      // Criar buraco quadrado
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
