import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mockStorageService, RoomDimensions } from '../../services/mockStorage';

interface RoomProps {
  dimensions?: RoomDimensions;
}

// Componente para parede com espessura e culling simples
const ThickWall: React.FC<{
  position: [number, number, number];
  dimensions: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  normalDirection: [number, number, number];
}> = ({ position, dimensions, rotation = [0, 0, 0], color, normalDirection }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current && camera) {
      // Posição da parede e câmera
      const wallPos = new THREE.Vector3(...position);
      const cameraPos = camera.position.clone();
      
      // Direção da câmera para a parede
      const cameraToWall = wallPos.clone().sub(cameraPos).normalize();
      
      // Normal da parede
      const normal = new THREE.Vector3(...normalDirection);
      
      // Se o produto escalar for negativo, a câmera está vendo a parede de frente
      const dot = normal.dot(cameraToWall);
      meshRef.current.visible = dot < 0.1; // Pequena margem para evitar flickering
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <boxGeometry args={dimensions} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
};

// Componente para chão/teto com culling simples
const ThickSurface: React.FC<{
  position: [number, number, number];
  dimensions: [number, number, number];
  color: string;
  isFloor?: boolean;
}> = ({ position, dimensions, color, isFloor = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current && camera) {
      const surfaceY = position[1];
      const cameraY = camera.position.y;
      
      if (isFloor) {
        // Mostrar chão se a câmera estiver acima
        meshRef.current.visible = cameraY > surfaceY + 0.1;
      } else {
        // Mostrar teto se a câmera estiver abaixo
        meshRef.current.visible = cameraY < surfaceY - 0.1;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={dimensions} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
};

export const Room: React.FC<RoomProps> = ({ dimensions }) => {
  const roomDimensions = dimensions || mockStorageService.getRoomDimensions();
  const wallHeight = roomDimensions.height;
  const wallThickness = 0.15;
  const floorThickness = 0.1;

  return (
    <group>
      {/* Chão */}
      <ThickSurface
        position={[0, -floorThickness / 2, 0]}
        dimensions={[roomDimensions.width + wallThickness, floorThickness, roomDimensions.length + wallThickness]}
        color="#8B7355"
        isFloor={true}
      />

      {/* Teto */}
      <ThickSurface
        position={[0, wallHeight + floorThickness / 2, 0]}
        dimensions={[roomDimensions.width + wallThickness, floorThickness, roomDimensions.length + wallThickness]}
        color="#ffffff"
        isFloor={false}
      />

      {/* Parede traseira (Norte) */}
      <ThickWall
        position={[0, wallHeight / 2, -roomDimensions.length / 2]}
        dimensions={[roomDimensions.width + wallThickness, wallHeight, wallThickness]}
        color="#f5f5f5"
        normalDirection={[0, 0, 1]}
      />

      {/* Parede esquerda (Oeste) */}
      <ThickWall
        position={[-roomDimensions.width / 2, wallHeight / 2, 0]}
        dimensions={[wallThickness, wallHeight, roomDimensions.length]}
        color="#f5f5f5"
        normalDirection={[1, 0, 0]}
      />

      {/* Parede direita (Leste) */}
      <ThickWall
        position={[roomDimensions.width / 2, wallHeight / 2, 0]}
        dimensions={[wallThickness, wallHeight, roomDimensions.length]}
        color="#f5f5f5"
        normalDirection={[-1, 0, 0]}
      />

      {/* Parede frontal esquerda */}
      <ThickWall
        position={[-roomDimensions.width / 4, wallHeight / 2, roomDimensions.length / 2]}
        dimensions={[roomDimensions.width / 2 - 1, wallHeight, wallThickness]}
        color="#f5f5f5"
        normalDirection={[0, 0, -1]}
      />

      {/* Parede frontal direita */}
      <ThickWall
        position={[roomDimensions.width / 4, wallHeight / 2, roomDimensions.length / 2]}
        dimensions={[roomDimensions.width / 2 - 1, wallHeight, wallThickness]}
        color="#f5f5f5"
        normalDirection={[0, 0, -1]}
      />

      {/* Rodapés - sempre visíveis */}
      <group>
        {/* Rodapé traseiro */}
        <mesh position={[0, 0.05, -roomDimensions.length / 2 + wallThickness / 2]}>
          <boxGeometry args={[roomDimensions.width, 0.1, wallThickness]} />
          <meshLambertMaterial color="#654321" />
        </mesh>

        {/* Rodapé esquerdo */}
        <mesh position={[-roomDimensions.width / 2 + wallThickness / 2, 0.05, 0]}>
          <boxGeometry args={[wallThickness, 0.1, roomDimensions.length - wallThickness]} />
          <meshLambertMaterial color="#654321" />
        </mesh>

        {/* Rodapé direito */}
        <mesh position={[roomDimensions.width / 2 - wallThickness / 2, 0.05, 0]}>
          <boxGeometry args={[wallThickness, 0.1, roomDimensions.length - wallThickness]} />
          <meshLambertMaterial color="#654321" />
        </mesh>

        {/* Rodapés frontais */}
        <mesh position={[-roomDimensions.width / 4, 0.05, roomDimensions.length / 2 - wallThickness / 2]}>
          <boxGeometry args={[roomDimensions.width / 2 - 1, 0.1, wallThickness]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        
        <mesh position={[roomDimensions.width / 4, 0.05, roomDimensions.length / 2 - wallThickness / 2]}>
          <boxGeometry args={[roomDimensions.width / 2 - 1, 0.1, wallThickness]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
      </group>
    </group>
  );
};
