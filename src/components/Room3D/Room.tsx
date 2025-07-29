import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mockStorageService, RoomDimensions } from '../../services/mockStorage';

interface RoomProps {
  dimensions?: RoomDimensions;
}

export const Room: React.FC<RoomProps> = ({ dimensions }) => {
  const roomDimensions = dimensions || mockStorageService.getRoomDimensions();
  const { width, length, height, floorThickness, wallThickness, ceilingThickness } = roomDimensions;

  // Refs para cada superfície
  const floorRef = useRef<THREE.Mesh>(null);
  const ceilingRef = useRef<THREE.Mesh>(null);
  const wallNorthRef = useRef<THREE.Mesh>(null);
  const wallSouthLeftRef = useRef<THREE.Mesh>(null);
  const wallSouthRightRef = useRef<THREE.Mesh>(null);
  const wallEastRef = useRef<THREE.Mesh>(null);
  const wallWestRef = useRef<THREE.Mesh>(null);

  const { camera } = useThree();

  // Sistema de culling otimizado
  useFrame(() => {
    if (!camera) return;

    const cameraPos = camera.position;

    // Chão - mostrar apenas se câmera estiver acima
    if (floorRef.current) {
      floorRef.current.visible = cameraPos.y > 0.2;
    }

    // Teto - mostrar apenas se câmera estiver abaixo
    if (ceilingRef.current) {
      ceilingRef.current.visible = cameraPos.y < height - 0.2;
    }

    // Paredes - mostrar apenas quando visualizadas de fora
    if (wallNorthRef.current) {
      wallNorthRef.current.visible = cameraPos.z > -length/2 + 0.3;
    }

    if (wallEastRef.current) {
      wallEastRef.current.visible = cameraPos.x < width/2 - 0.3;
    }

    if (wallWestRef.current) {
      wallWestRef.current.visible = cameraPos.x > -width/2 + 0.3;
    }

    // Paredes do sul (com entrada)
    if (wallSouthLeftRef.current) {
      wallSouthLeftRef.current.visible = cameraPos.z < length/2 - 0.3;
    }

    if (wallSouthRightRef.current) {
      wallSouthRightRef.current.visible = cameraPos.z < length/2 - 0.3;
    }
  });

  const doorWidth = 2;

  // Altura efetiva das paredes (entre chão e teto)
  const wallHeight = height - wallThickness - wallThickness;
  const wallCenterY = wallThickness + wallHeight/2;

  return (
    <group>
      {/* Chão - base do quarto - mesma espessura das paredes */}
      <mesh ref={floorRef} position={[0, wallThickness/2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[width, length, wallThickness]} />
        <meshLambertMaterial color="#8B7355" />
      </mesh>

      {/* Teto - topo do quarto - mesma espessura das paredes */}
      <mesh ref={ceilingRef} position={[0, height - wallThickness/2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[width, length, wallThickness]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>

      {/* Parede Norte - IGUAL A TODAS */}
      <mesh ref={wallNorthRef} position={[0, wallCenterY, -length/2 + wallThickness/2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>

      {/* Parede Sul - IGUAL A TODAS */}
      <mesh ref={wallSouthLeftRef} position={[0, wallCenterY, length/2 - wallThickness/2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>

      {/* Parede Leste - IGUAL A TODAS */}
      <mesh ref={wallEastRef} position={[width/2 - wallThickness/2, wallCenterY, 0]} rotation={[0, Math.PI/2, 0]}>
        <boxGeometry args={[length, wallHeight, wallThickness]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>

      {/* Parede Oeste - IGUAL A TODAS */}
      <mesh ref={wallWestRef} position={[-width/2 + wallThickness/2, wallCenterY, 0]} rotation={[0, Math.PI/2, 0]}>
        <boxGeometry args={[length, wallHeight, wallThickness]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>
    </group>
  );
};
