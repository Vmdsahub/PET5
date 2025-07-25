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
        receiveShadow
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
          receiveShadow
        >
          <planeGeometry args={[roomSize / 2, wallHeight]} />
          <meshStandardMaterial 
            color="#f5f5f5" 
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
        
        {/* Parte direita da parede da frente */}
        <mesh 
          position={[roomSize / 4, wallHeight / 2, roomSize / 2]}
          rotation={[0, Math.PI, 0]}
          receiveShadow
        >
          <planeGeometry args={[roomSize / 2, wallHeight]} />
          <meshStandardMaterial 
            color="#f5f5f5" 
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
      </group>

      {/* Parede esquerda (Oeste) */}
      <mesh 
        position={[-roomSize / 2, wallHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomSize, wallHeight]} />
        <meshStandardMaterial 
          color="#f5f5f5" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Parede direita (Leste) */}
      <mesh 
        position={[roomSize / 2, wallHeight / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomSize, wallHeight]} />
        <meshStandardMaterial 
          color="#f5f5f5" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Teto */}
      <mesh 
        rotation={[Math.PI / 2, 0, 0]} 
        position={[0, wallHeight, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomSize, roomSize]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>

      {/* Rodapés */}
      {/* Rodapé traseiro */}
      <mesh position={[0, 0.1, -roomSize / 2 + 0.05]}>
        <boxGeometry args={[roomSize, 0.2, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Rodapé esquerdo */}
      <mesh position={[-roomSize / 2 + 0.05, 0.1, 0]}>
        <boxGeometry args={[0.1, 0.2, roomSize]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Rodapé direito */}
      <mesh position={[roomSize / 2 - 0.05, 0.1, 0]}>
        <boxGeometry args={[0.1, 0.2, roomSize]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Rodapés da parede da frente (divididos) */}
      <mesh position={[-roomSize / 4, 0.1, roomSize / 2 - 0.05]}>
        <boxGeometry args={[roomSize / 2, 0.2, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      <mesh position={[roomSize / 4, 0.1, roomSize / 2 - 0.05]}>
        <boxGeometry args={[roomSize / 2, 0.2, 0.1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
};
