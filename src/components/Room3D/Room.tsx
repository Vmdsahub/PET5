import React from 'react';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

export const Room: React.FC = () => {
  // Carregar texturas (usando cores por enquanto, depois pode adicionar texturas)
  const roomSize = 10;
  const wallHeight = 5;

  return (
    <group>
      {/* Chão */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[roomSize, roomSize]} />
        <meshLambertMaterial
          color="#8B7355"
        />
      </mesh>

      {/* Parede traseira (Norte) */}
      <mesh
        position={[0, wallHeight / 2, -roomSize / 2]}
      >
        <planeGeometry args={[roomSize, wallHeight]} />
        <meshLambertMaterial
          color="#f5f5f5"
        />
      </mesh>

      {/* Parede da frente (Sul) - deixar aberta para entrada */}
      <group>
        {/* Parte esquerda da parede da frente */}
        <mesh
          position={[-roomSize / 4, wallHeight / 2, roomSize / 2]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[roomSize / 2, wallHeight]} />
          <meshLambertMaterial
            color="#f5f5f5"
          />
        </mesh>
        
        {/* Parte direita da parede da frente */}
        <mesh
          position={[roomSize / 4, wallHeight / 2, roomSize / 2]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[roomSize / 2, wallHeight]} />
          <meshLambertMaterial
            color="#f5f5f5"
          />
        </mesh>
      </group>

      {/* Parede esquerda (Oeste) */}
      <mesh
        position={[-roomSize / 2, wallHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[roomSize, wallHeight]} />
        <meshLambertMaterial
          color="#f5f5f5"
        />
      </mesh>

      {/* Parede direita (Leste) */}
      <mesh
        position={[roomSize / 2, wallHeight / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[roomSize, wallHeight]} />
        <meshLambertMaterial
          color="#f5f5f5"
        />
      </mesh>

      {/* Teto */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, wallHeight, 0]}
      >
        <planeGeometry args={[roomSize, roomSize]} />
        <meshLambertMaterial
          color="#ffffff"
        />
      </mesh>


    </group>
  );
};
