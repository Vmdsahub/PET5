import React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface TextureDropHandlerProps {
  draggedTexture: any;
  onTextureApplied: (surfaceType: string, wallId?: string) => void;
  onTextureFailed: () => void;
}

export const TextureDropHandler: React.FC<TextureDropHandlerProps> = ({
  draggedTexture,
  onTextureApplied,
  onTextureFailed
}) => {
  const { scene, camera } = useThree();

  // Função para lidar com o drop de textura
  const handleTextureDropOnSurface = (dropX: number, dropY: number) => {
    if (!draggedTexture) return;

    console.log(`🎯 Aplicando textura "${draggedTexture.name}" (${draggedTexture.type})`);

    // Obter canvas
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error('Canvas não encontrado');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    
    // Converter coordenadas do mouse para NDC
    const mouse = new THREE.Vector2();
    mouse.x = ((dropX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((dropY - rect.top) / rect.height) * 2 + 1;

    // Criar raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Buscar apenas as meshes do quarto que estão VISÍVEIS
    const roomMeshes: THREE.Mesh[] = [];

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.visible) { // Apenas meshes visíveis
        if (child.name &&
            (child.name === 'floor' || child.name === 'ceiling' || child.name.startsWith('wall-'))) {
          roomMeshes.push(child);
          console.log(`✅ Mesh visível: ${child.name}`);
        }
      }
    });

    console.log(`🏠 Superfícies visíveis para raycasting: ${roomMeshes.length}`);

    if (roomMeshes.length === 0) {
      console.log('❌ Nenhuma superfície do quarto foi encontrada na cena');
      onTextureFailed();
      return;
    }

    // Fazer raycast
    const intersects = raycaster.intersectObjects(roomMeshes);
    
    if (intersects.length === 0) {
      console.log('❌ Nenhuma superfície do quarto foi atingida pelo raycasting');
      onTextureFailed();
      return;
    }

    // Pegar a primeira intersecção (mais próxima)
    const intersectedObject = intersects[0].object;
    const surfaceName = intersectedObject.name;
    
    console.log(`🎯 Superfície detectada: ${surfaceName}`);

    // Determinar o tipo de superfície baseado no nome
    let surfaceType: string;
    let wallId: string | undefined;

    if (surfaceName === 'floor') {
      surfaceType = 'floor';
    } else if (surfaceName === 'ceiling') {
      surfaceType = 'ceiling';
    } else if (surfaceName.startsWith('wall-')) {
      surfaceType = 'wall';
      wallId = surfaceName.replace('wall-', ''); // north, south, east, west
    } else {
      console.log('❌ Superfície não reconhecida');
      onTextureFailed();
      return;
    }

    // Verificar compatibilidade
    if (draggedTexture.type !== surfaceType) {
      const typeNames = {
        floor: 'chão',
        wall: 'parede', 
        ceiling: 'teto'
      };
      alert(`Esta textura é para ${typeNames[draggedTexture.type as keyof typeof typeNames]}, não para ${typeNames[surfaceType as keyof typeof typeNames]}.`);
      onTextureFailed();
      return;
    }

    console.log(`✅ Aplicando textura ${draggedTexture.name} em ${surfaceType}${wallId ? ` (${wallId})` : ''}`);
    onTextureApplied(surfaceType, wallId);
  };

  // Expor a função globalmente para ser chamada pelo RoomUI
  React.useEffect(() => {
    (window as any).handleTextureDropOnSurface = handleTextureDropOnSurface;
    
    return () => {
      delete (window as any).handleTextureDropOnSurface;
    };
  }, [draggedTexture]);

  return null; // Este componente não renderiza nada
};
