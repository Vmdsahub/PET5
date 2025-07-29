import React from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { mockStorageService, RoomDimensions } from '../../services/mockStorage';

interface RoomProps {
  dimensions?: RoomDimensions;
}

export const Room: React.FC<RoomProps> = ({ dimensions }) => {
  // Usar dimensões fornecidas ou padrões do storage
  const roomDimensions = dimensions || mockStorageService.getRoomDimensions();
  const roomSize = Math.max(roomDimensions.width, roomDimensions.length);
  const wallHeight = roomDimensions.height;

  return (
    <group>
      {/* Chão */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[roomDimensions.width, roomDimensions.length]} />
        <meshLambertMaterial
          color="#8B7355"
        />
      </mesh>

      {/* Parede traseira (Norte) */}
      <mesh
        position={[0, wallHeight / 2, -roomDimensions.length / 2]}
      >
        <planeGeometry args={[roomDimensions.width, wallHeight]} />
        <meshLambertMaterial
          color="#f5f5f5"
        />
      </mesh>

      {/* Parede da frente (Sul) - deixar aberta para entrada */}
      <group>
        {/* Parte esquerda da parede da frente */}
        <mesh
          position={[-roomDimensions.width / 4, wallHeight / 2, roomDimensions.length / 2]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[roomDimensions.width / 2, wallHeight]} />
          <meshLambertMaterial
            color="#f5f5f5"
          />
        </mesh>

        {/* Parte direita da parede da frente */}
        <mesh
          position={[roomDimensions.width / 4, wallHeight / 2, roomDimensions.length / 2]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[roomDimensions.width / 2, wallHeight]} />
          <meshLambertMaterial
            color="#f5f5f5"
          />
        </mesh>
      </group>

      {/* Parede esquerda (Oeste) */}
      <mesh
        position={[-roomDimensions.width / 2, wallHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[roomDimensions.length, wallHeight]} />
        <meshLambertMaterial
          color="#f5f5f5"
        />
      </mesh>

      {/* Parede direita (Leste) */}
      <mesh
        position={[roomDimensions.width / 2, wallHeight / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[roomDimensions.length, wallHeight]} />
        <meshLambertMaterial
          color="#f5f5f5"
        />
      </mesh>

      {/* Teto */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, wallHeight, 0]}
      >
        <planeGeometry args={[roomDimensions.width, roomDimensions.length]} />
        <meshLambertMaterial
          color="#ffffff"
        />
      </mesh>


    </group>
  );
};
