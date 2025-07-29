import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mockStorageService, RoomDimensions } from '../../services/mockStorage';

interface RoomProps {
  dimensions?: RoomDimensions;
}

// Componente para parede com espessura
const ThickWall: React.FC<{
  position: [number, number, number];
  dimensions: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  children?: React.ReactNode;
}> = ({ position, dimensions, rotation = [0, 0, 0], color, children }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current && camera) {
      // Calcular se a parede deve ser visível baseado na posição da câmera
      const wallPosition = new THREE.Vector3(...position);
      const cameraPosition = camera.position.clone();
      
      // Direção da parede (normal)
      const wallNormal = new THREE.Vector3(0, 0, 1);
      wallNormal.applyEuler(new THREE.Euler(...rotation));
      
      // Direção da câmera para a parede
      const cameraToWall = wallPosition.clone().sub(cameraPosition).normalize();
      
      // Se o produto escalar for positivo, a câmera está vendo a face externa
      const dot = wallNormal.dot(cameraToWall);
      
      meshRef.current.visible = dot > 0;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <boxGeometry args={dimensions} />
      <meshLambertMaterial color={color} />
      {children}
    </mesh>
  );
};

// Componente para superfície plana com espessura (chão/teto)
const ThickSurface: React.FC<{
  position: [number, number, number];
  dimensions: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  isFloor?: boolean;
}> = ({ position, dimensions, rotation = [0, 0, 0], color, isFloor = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current && camera) {
      const surfacePosition = new THREE.Vector3(...position);
      const cameraPosition = camera.position.clone();
      
      // Para chão e teto, verificar se a câmera está acima ou abaixo
      if (isFloor) {
        // Mostrar chão apenas se a câmera estiver acima
        meshRef.current.visible = cameraPosition.y > surfacePosition.y;
      } else {
        // Mostrar teto apenas se a câmera estiver abaixo
        meshRef.current.visible = cameraPosition.y < surfacePosition.y;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <boxGeometry args={dimensions} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
};

export const Room: React.FC<RoomProps> = ({ dimensions }) => {
  // Usar dimensões fornecidas ou padrões do storage
  const roomDimensions = dimensions || mockStorageService.getRoomDimensions();
  const wallHeight = roomDimensions.height;
  const wallThickness = 0.2; // Espessura das paredes
  const floorThickness = 0.1; // Espessura do chão
  const ceilingThickness = 0.1; // Espessura do teto

  return (
    <group>
      {/* Chão com espessura */}
      <ThickSurface
        position={[0, -floorThickness / 2, 0]}
        dimensions={[roomDimensions.width, floorThickness, roomDimensions.length]}
        color="#8B7355"
        isFloor={true}
      />

      {/* Teto com espessura */}
      <ThickSurface
        position={[0, wallHeight + ceilingThickness / 2, 0]}
        dimensions={[roomDimensions.width, ceilingThickness, roomDimensions.length]}
        color="#ffffff"
        isFloor={false}
      />

      {/* Parede traseira (Norte) com espessura */}
      <ThickWall
        position={[0, wallHeight / 2, -roomDimensions.length / 2 - wallThickness / 2]}
        dimensions={[roomDimensions.width, wallHeight, wallThickness]}
        color="#f5f5f5"
      />

      {/* Parede da frente (Sul) - dividida em duas partes para entrada */}
      <group>
        {/* Parte esquerda da parede da frente */}
        <ThickWall
          position={[-roomDimensions.width / 4, wallHeight / 2, roomDimensions.length / 2 + wallThickness / 2]}
          dimensions={[roomDimensions.width / 2, wallHeight, wallThickness]}
          rotation={[0, Math.PI, 0]}
          color="#f5f5f5"
        />

        {/* Parte direita da parede da frente */}
        <ThickWall
          position={[roomDimensions.width / 4, wallHeight / 2, roomDimensions.length / 2 + wallThickness / 2]}
          dimensions={[roomDimensions.width / 2, wallHeight, wallThickness]}
          rotation={[0, Math.PI, 0]}
          color="#f5f5f5"
        />
      </group>

      {/* Parede esquerda (Oeste) com espessura */}
      <ThickWall
        position={[-roomDimensions.width / 2 - wallThickness / 2, wallHeight / 2, 0]}
        dimensions={[wallThickness, wallHeight, roomDimensions.length]}
        rotation={[0, Math.PI / 2, 0]}
        color="#f5f5f5"
      />

      {/* Parede direita (Leste) com espessura */}
      <ThickWall
        position={[roomDimensions.width / 2 + wallThickness / 2, wallHeight / 2, 0]}
        dimensions={[wallThickness, wallHeight, roomDimensions.length]}
        rotation={[0, -Math.PI / 2, 0]}
        color="#f5f5f5"
      />

      {/* Rodapés (opcional, para melhor acabamento) */}
      <group>
        {/* Rodapé parede traseira */}
        <mesh position={[0, 0.1, -roomDimensions.length / 2 - wallThickness / 4]}>
          <boxGeometry args={[roomDimensions.width, 0.2, wallThickness / 2]} />
          <meshLambertMaterial color="#6B5B47" />
        </mesh>

        {/* Rodapé parede esquerda */}
        <mesh position={[-roomDimensions.width / 2 - wallThickness / 4, 0.1, 0]}>
          <boxGeometry args={[wallThickness / 2, 0.2, roomDimensions.length]} />
          <meshLambertMaterial color="#6B5B47" />
        </mesh>

        {/* Rodapé parede direita */}
        <mesh position={[roomDimensions.width / 2 + wallThickness / 4, 0.1, 0]}>
          <boxGeometry args={[wallThickness / 2, 0.2, roomDimensions.length]} />
          <meshLambertMaterial color="#6B5B47" />
        </mesh>

        {/* Rodapés da parede frontal (partes esquerda e direita) */}
        <mesh position={[-roomDimensions.width / 4, 0.1, roomDimensions.length / 2 + wallThickness / 4]}>
          <boxGeometry args={[roomDimensions.width / 2, 0.2, wallThickness / 2]} />
          <meshLambertMaterial color="#6B5B47" />
        </mesh>
        
        <mesh position={[roomDimensions.width / 4, 0.1, roomDimensions.length / 2 + wallThickness / 4]}>
          <boxGeometry args={[roomDimensions.width / 2, 0.2, wallThickness / 2]} />
          <meshLambertMaterial color="#6B5B47" />
        </mesh>
      </group>

      {/* Molduras do teto (opcional, para melhor acabamento) */}
      <group>
        {/* Moldura parede traseira */}
        <mesh position={[0, wallHeight - 0.1, -roomDimensions.length / 2 - wallThickness / 4]}>
          <boxGeometry args={[roomDimensions.width, 0.2, wallThickness / 2]} />
          <meshLambertMaterial color="#E5E5E5" />
        </mesh>

        {/* Moldura parede esquerda */}
        <mesh position={[-roomDimensions.width / 2 - wallThickness / 4, wallHeight - 0.1, 0]}>
          <boxGeometry args={[wallThickness / 2, 0.2, roomDimensions.length]} />
          <meshLambertMaterial color="#E5E5E5" />
        </mesh>

        {/* Moldura parede direita */}
        <mesh position={[roomDimensions.width / 2 + wallThickness / 4, wallHeight - 0.1, 0]}>
          <boxGeometry args={[wallThickness / 2, 0.2, roomDimensions.length]} />
          <meshLambertMaterial color="#E5E5E5" />
        </mesh>

        {/* Molduras da parede frontal */}
        <mesh position={[-roomDimensions.width / 4, wallHeight - 0.1, roomDimensions.length / 2 + wallThickness / 4]}>
          <boxGeometry args={[roomDimensions.width / 2, 0.2, wallThickness / 2]} />
          <meshLambertMaterial color="#E5E5E5" />
        </mesh>
        
        <mesh position={[roomDimensions.width / 4, wallHeight - 0.1, roomDimensions.length / 2 + wallThickness / 4]}>
          <boxGeometry args={[roomDimensions.width / 2, 0.2, wallThickness / 2]} />
          <meshLambertMaterial color="#E5E5E5" />
        </mesh>
      </group>
    </group>
  );
};
