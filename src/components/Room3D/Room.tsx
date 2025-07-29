import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mockStorageService, RoomDimensions } from '../../services/mockStorage';

interface RoomProps {
  dimensions?: RoomDimensions;
}

export const Room: React.FC<RoomProps> = ({ dimensions }) => {
  const roomDimensions = dimensions || mockStorageService.getRoomDimensions();
  const { width, length, height } = roomDimensions;
  
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

  const wallThickness = 0.1;
  const doorWidth = 2;

  return (
    <group>
      {/* Chão */}
      <mesh ref={floorRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[width, length, wallThickness]} />
        <meshLambertMaterial color="#8B7355" />
      </mesh>

      {/* Teto */}
      <mesh ref={ceilingRef} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[width, length, wallThickness]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>

      {/* Parede Norte (traseira) */}
      <mesh ref={wallNorthRef} position={[0, height/2, -length/2]} rotation={[0, 0, 0]}>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>

      {/* Parede Sul Esquerda (com entrada) */}
      <mesh 
        ref={wallSouthLeftRef} 
        position={[-(width - doorWidth)/4, height/2, length/2]} 
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[(width - doorWidth)/2, height, wallThickness]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>

      {/* Parede Sul Direita (com entrada) */}
      <mesh 
        ref={wallSouthRightRef} 
        position={[(width - doorWidth)/4, height/2, length/2]} 
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[(width - doorWidth)/2, height, wallThickness]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>

      {/* Parede Leste (direita) */}
      <mesh ref={wallEastRef} position={[width/2, height/2, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[wallThickness, height, length]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>

      {/* Parede Oeste (esquerda) */}
      <mesh ref={wallWestRef} position={[-width/2, height/2, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[wallThickness, height, length]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>

      {/* Rodapé simples - apenas uma linha no chão */}
      <group>
        {/* Rodapé Norte */}
        <mesh position={[0, 0.02, -length/2 + wallThickness/2]}>
          <boxGeometry args={[width - wallThickness, 0.04, wallThickness/2]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        
        {/* Rodapé Leste */}
        <mesh position={[width/2 - wallThickness/2, 0.02, 0]}>
          <boxGeometry args={[wallThickness/2, 0.04, length - wallThickness]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        
        {/* Rodapé Oeste */}
        <mesh position={[-width/2 + wallThickness/2, 0.02, 0]}>
          <boxGeometry args={[wallThickness/2, 0.04, length - wallThickness]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        
        {/* Rodapés Sul (partes da entrada) */}
        <mesh position={[-(width - doorWidth)/4, 0.02, length/2 - wallThickness/2]}>
          <boxGeometry args={[(width - doorWidth)/2 - wallThickness, 0.04, wallThickness/2]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        
        <mesh position={[(width - doorWidth)/4, 0.02, length/2 - wallThickness/2]}>
          <boxGeometry args={[(width - doorWidth)/2 - wallThickness, 0.04, wallThickness/2]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
      </group>
    </group>
  );
};
