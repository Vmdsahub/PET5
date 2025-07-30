import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mockStorageService, RoomDimensions } from '../../services/mockStorage';
import { useRoomTextures } from '../../hooks/useRoomTextures';

interface RoomProps {
  dimensions?: RoomDimensions;
  userId?: string;
  draggedTexture?: any;
}

export const Room: React.FC<RoomProps> = ({ dimensions, userId = 'default', draggedTexture }) => {
  const roomDimensions = dimensions || mockStorageService.getRoomDimensions();
  const { width, length, height, floorThickness, wallThickness, ceilingThickness } = roomDimensions;

  // Hook para gerenciar texturas
  const { roomTextures, createMaterialFromTexture } = useRoomTextures(userId);

  // Estado para forçar re-render quando texturas mudam
  const [updateKey, setUpdateKey] = useState(0);

  // Listener para atualizações de textura
  useEffect(() => {
    const handleTextureUpdate = () => {
      setUpdateKey(prev => prev + 1);
    };

    const handleForceUpdate = () => {
      setUpdateKey(prev => prev + 1);
    };

    window.addEventListener('roomTextureUpdate', handleTextureUpdate);
    window.addEventListener('forceRoomUpdate', handleForceUpdate);

    return () => {
      window.removeEventListener('roomTextureUpdate', handleTextureUpdate);
      window.removeEventListener('forceRoomUpdate', handleForceUpdate);
    };
  }, []);

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
  const wallHeight = height - floorThickness - ceilingThickness;
  const wallCenterY = floorThickness + wallHeight/2;

  return (
    <group>
      {/* Chão - base do quarto */}
      <mesh
        ref={floorRef}
        name="floor"
        position={[0, floorThickness/2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{ surfaceType: 'floor' }}
      >
        <boxGeometry args={[width, length, floorThickness]} />
        <primitive
          key={`floor_${updateKey}`}
          object={createMaterialFromTexture(
            roomTextures.floor,
            draggedTexture?.type === 'floor' ? '#9B8365' : '#8B7355',
            'floor'
          )}
        />
      </mesh>

      {/* Teto - topo do quarto */}
      <mesh
        ref={ceilingRef}
        name="ceiling"
        position={[0, height - ceilingThickness/2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        userData={{ surfaceType: 'ceiling' }}
      >
        <boxGeometry args={[width, length, ceilingThickness]} />
        <primitive
          key={`ceiling_${updateKey}`}
          object={createMaterialFromTexture(
            roomTextures.ceiling,
            draggedTexture?.type === 'ceiling' ? '#f8f8f8' : '#ffffff',
            'ceiling'
          )}
        />
      </mesh>

      {/* Parede Norte */}
      <mesh
        ref={wallNorthRef}
        name="wall-north"
        position={[0, wallCenterY, -length/2 + wallThickness/2]}
        rotation={[0, 0, 0]}
        userData={{ wallId: 'north', surfaceType: 'wall' }}
      >
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <primitive
          key={`wall_north_${updateKey}`}
          object={createMaterialFromTexture(
            roomTextures.walls['north'],
            draggedTexture?.type === 'wall' ? '#f8f8f8' : '#f5f5f5',
            'wall_north'
          )}
        />
      </mesh>

      {/* Parede Sul */}
      <mesh
        ref={wallSouthLeftRef}
        name="wall-south"
        position={[0, wallCenterY, length/2 - wallThickness/2]}
        rotation={[0, 0, 0]}
        userData={{ wallId: 'south', surfaceType: 'wall' }}
      >
        <boxGeometry args={[width, wallHeight, wallThickness]} />
        <primitive
          key={`wall_south_${updateKey}`}
          object={createMaterialFromTexture(
            roomTextures.walls['south'],
            draggedTexture?.type === 'wall' ? '#f8f8f8' : '#f5f5f5',
            'wall_south'
          )}
        />
      </mesh>

      {/* Parede Leste */}
      <mesh
        ref={wallEastRef}
        name="wall-east"
        position={[width/2 - wallThickness/2, wallCenterY, 0]}
        rotation={[0, Math.PI/2, 0]}
        userData={{ wallId: 'east', surfaceType: 'wall' }}
      >
        <boxGeometry args={[length, wallHeight, wallThickness]} />
        <primitive
          key={`wall_east_${updateKey}`}
          object={createMaterialFromTexture(
            roomTextures.walls['east'],
            draggedTexture?.type === 'wall' ? '#f8f8f8' : '#f5f5f5',
            'wall_east'
          )}
        />
      </mesh>

      {/* Parede Oeste */}
      <mesh
        ref={wallWestRef}
        name="wall-west"
        position={[-width/2 + wallThickness/2, wallCenterY, 0]}
        rotation={[0, Math.PI/2, 0]}
        userData={{ wallId: 'west', surfaceType: 'wall' }}
      >
        <boxGeometry args={[length, wallHeight, wallThickness]} />
        <primitive
          key={`wall_west_${updateKey}`}
          object={createMaterialFromTexture(
            roomTextures.walls['west'],
            draggedTexture?.type === 'wall' ? '#f8f8f8' : '#f5f5f5',
            'wall_west'
          )}
        />
      </mesh>
    </group>
  );
};
