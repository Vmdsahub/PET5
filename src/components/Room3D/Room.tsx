import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mockStorageService, RoomDimensions } from '../../services/mockStorage';
import { useRoomTextures } from '../../hooks/useRoomTextures';
import { WallWithCutouts } from './WallWithCutouts';

interface RoomProps {
  dimensions?: RoomDimensions;
  userId?: string;
  draggedTexture?: any;
  windowCutouts?: Array<{
    position: [number, number, number];
    wallDirection: 'north' | 'south' | 'east' | 'west';
    size: [number, number];
  }>;
}

export const Room: React.FC<RoomProps> = ({ dimensions, userId = 'default', draggedTexture, windowCutouts = [] }) => {
  const roomDimensions = dimensions || mockStorageService.getRoomDimensions();
  const { width, length, height, floorThickness, wallThickness, ceilingThickness } = roomDimensions;

  // Hook para gerenciar texturas
  const { roomTextures, createMaterialFromTexture } = useRoomTextures(userId);



  // Debounce para atualizações de material
  const materialUpdateRef = useRef<NodeJS.Timeout>();

  // Listener otimizado para atualizações de textura
  useEffect(() => {
    const handleTextureUpdate = () => {
      // Debounce para evitar atualizações excessivas
      if (materialUpdateRef.current) {
        clearTimeout(materialUpdateRef.current);
      }

      materialUpdateRef.current = setTimeout(() => {
        requestAnimationFrame(() => {
          updateRoomMaterials();
        });
      }, 100);
    };

    const handleForceUpdate = () => {
      // Força atualização imediata quando necessário
      requestAnimationFrame(() => {
        updateRoomMaterials();
      });
    };

    window.addEventListener('roomTextureUpdate', handleTextureUpdate);
    window.addEventListener('forceRoomUpdate', handleForceUpdate);

    return () => {
      if (materialUpdateRef.current) {
        clearTimeout(materialUpdateRef.current);
      }
      window.removeEventListener('roomTextureUpdate', handleTextureUpdate);
      window.removeEventListener('forceRoomUpdate', handleForceUpdate);
    };
  }, []);

  // Função assíncrona para atualizar materiais sem bloquear UI
  const updateRoomMaterials = async () => {
    // Dividir atualizações em chunks para não bloquear UI
    const updateChunk = async (action: () => void) => {
      return new Promise<void>((resolve) => {
        requestIdleCallback(() => {
          action();
          resolve();
        });
      });
    };

    // Atualizar chão
    if (floorRef.current) {
      await updateChunk(() => {
        if (floorRef.current) {
          floorRef.current.material = createMaterialFromTexture(roomTextures.floor, '#8B7355', 'floor');
        }
      });
    }

    // Atualizar teto
    if (ceilingRef.current) {
      await updateChunk(() => {
        if (ceilingRef.current) {
          ceilingRef.current.material = createMaterialFromTexture(roomTextures.ceiling, '#f8f8f8', 'ceiling');
        }
      });
    }

    // Atualizar paredes com cutouts através de eventos
    // As paredes agora são componentes WallWithCutouts que se atualizam automaticamente
  };

  // Refs para cada superfície
  const floorRef = useRef<THREE.Mesh>(null);
  const ceilingRef = useRef<THREE.Mesh>(null);
  const wallNorthRef = useRef<THREE.Mesh>(null);
  const wallSouthRef = useRef<THREE.Mesh>(null);
  const wallEastRef = useRef<THREE.Mesh>(null);
  const wallWestRef = useRef<THREE.Mesh>(null);

  const { camera } = useThree();

  // Sistema de culling otimizado com throttling
  const lastCullingUpdate = useRef(0);
  const cullingThrottle = 100; // ms

  useFrame((state) => {
    if (!camera) return;

    // Throttle para evitar cálculos excessivos
    const now = state.clock.elapsedTime * 1000;
    if (now - lastCullingUpdate.current < cullingThrottle) return;
    lastCullingUpdate.current = now;

    const cameraPos = camera.position;

    // Batch visibility updates para melhor performance
    requestIdleCallback(() => {
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

      if (wallSouthRef.current) {
        wallSouthRef.current.visible = cameraPos.z < length/2 - 0.3;
      }
    });
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
        receiveShadow={true}
        castShadow={false}
      >
        <boxGeometry args={[width, length, floorThickness]} />
        <primitive
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
        receiveShadow={true}
        castShadow={true}
      >
        <boxGeometry args={[width, length, ceilingThickness]} />
        <primitive
          object={createMaterialFromTexture(
            roomTextures.ceiling,
            draggedTexture?.type === 'ceiling' ? '#f8f8f8' : '#ffffff',
            'ceiling'
          )}
        />
      </mesh>

      {/* Parede Norte */}
      <WallWithCutouts
        wallDirection="north"
        wallDimensions={{
          width: width,
          height: wallHeight,
          thickness: wallThickness,
          position: [0, wallCenterY, -length/2 + wallThickness/2],
          rotation: [0, 0, 0]
        }}
        cutouts={windowCutouts}
        material={createMaterialFromTexture(
          roomTextures.walls['north'],
          draggedTexture?.type === 'wall' ? '#f8f8f8' : '#f5f5f5',
          'wall_north'
        )}
        name="wall-north"
        userData={{ wallId: 'north', surfaceType: 'wall' }}
        wallRef={wallNorthRef}
      />

      {/* Parede Sul */}
      <WallWithCutouts
        wallDirection="south"
        wallDimensions={{
          width: width,
          height: wallHeight,
          thickness: wallThickness,
          position: [0, wallCenterY, length/2 - wallThickness/2],
          rotation: [0, 0, 0]
        }}
        cutouts={windowCutouts}
        material={createMaterialFromTexture(
          roomTextures.walls['south'],
          draggedTexture?.type === 'wall' ? '#f8f8f8' : '#f5f5f5',
          'wall_south'
        )}
        name="wall-south"
        userData={{ wallId: 'south', surfaceType: 'wall' }}
        wallRef={wallSouthRef}
      />

      {/* Parede Leste */}
      <WallWithCutouts
        wallDirection="east"
        wallDimensions={{
          width: length,
          height: wallHeight,
          thickness: wallThickness,
          position: [width/2 - wallThickness/2, wallCenterY, 0],
          rotation: [0, Math.PI/2, 0]
        }}
        cutouts={windowCutouts}
        material={createMaterialFromTexture(
          roomTextures.walls['east'],
          draggedTexture?.type === 'wall' ? '#f8f8f8' : '#f5f5f5',
          'wall_east'
        )}
        name="wall-east"
        userData={{ wallId: 'east', surfaceType: 'wall' }}
        wallRef={wallEastRef}
      />

      {/* Parede Oeste */}
      <WallWithCutouts
        wallDirection="west"
        wallDimensions={{
          width: length,
          height: wallHeight,
          thickness: wallThickness,
          position: [-width/2 + wallThickness/2, wallCenterY, 0],
          rotation: [0, Math.PI/2, 0]
        }}
        cutouts={windowCutouts}
        material={createMaterialFromTexture(
          roomTextures.walls['west'],
          draggedTexture?.type === 'wall' ? '#f8f8f8' : '#f5f5f5',
          'wall_west'
        )}
        name="wall-west"
        userData={{ wallId: 'west', surfaceType: 'wall' }}
        wallRef={wallWestRef}
      />
    </group>
  );
};
