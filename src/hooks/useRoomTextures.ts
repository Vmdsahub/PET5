import { useState, useEffect } from 'react';
import * as THREE from 'three';

interface TextureData {
  id: string;
  name: string;
  type: 'floor' | 'wall' | 'ceiling';
  textureUrls: {
    diffuse?: string;
    normal?: string;
    roughness?: string;
    displacement?: string;
    metallic?: string;
    ao?: string;
  };
}

interface RoomTextures {
  floor: TextureData | null;
  walls: { [wallId: string]: TextureData | null };
  ceiling: TextureData | null;
}

export const useRoomTextures = (userId: string) => {
  const [roomTextures, setRoomTextures] = useState<RoomTextures>({
    floor: null,
    walls: {},
    ceiling: null
  });

  // Carregar texturas do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`room_textures_${userId}`);
    if (stored) {
      try {
        setRoomTextures(JSON.parse(stored));
      } catch (error) {
        console.warn('Erro ao carregar texturas do quarto:', error);
      }
    }
  }, [userId]);

  // Salvar texturas no localStorage
  const saveTextures = (newTextures: RoomTextures) => {
    setRoomTextures(newTextures);
    localStorage.setItem(`room_textures_${userId}`, JSON.stringify(newTextures));
  };

  // Aplicar textura ao chão
  const applyFloorTexture = (textureData: TextureData) => {
    const newTextures = {
      ...roomTextures,
      floor: textureData
    };
    saveTextures(newTextures);

    // Forçar re-render forçando uma atualização de estado
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('roomTextureUpdate'));
    }, 100);
  };

  // Aplicar textura ao teto
  const applyCeilingTexture = (textureData: TextureData) => {
    const newTextures = {
      ...roomTextures,
      ceiling: textureData
    };
    saveTextures(newTextures);

    // Forçar re-render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('roomTextureUpdate'));
    }, 100);
  };

  // Aplicar textura a uma parede específica
  const applyWallTexture = (wallId: string, textureData: TextureData) => {
    const newTextures = {
      ...roomTextures,
      walls: {
        ...roomTextures.walls,
        [wallId]: textureData
      }
    };
    saveTextures(newTextures);

    // Forçar re-render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('roomTextureUpdate'));
    }, 100);
  };

  // Criar material Three.js a partir dos dados da textura
  const createMaterialFromTexture = (textureData: TextureData | null, defaultColor: string = '#ffffff', surfaceKey?: string) => {
    if (!textureData || !textureData.textureUrls.diffuse) {
      return new THREE.MeshLambertMaterial({
        color: defaultColor,
        name: `default_${surfaceKey || 'surface'}`
      });
    }

    const loader = new THREE.TextureLoader();

    // Criar material PBR completo
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.8,
      metalness: 0.1,
      name: `texture_${surfaceKey || 'surface'}_${Date.now()}`
    });

    // Função helper para configurar texturas otimizadas para decoração
    const configureTexture = (texture: THREE.Texture, textureType: string = 'diffuse') => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      // Ajustar repeat baseado no tipo de textura e superfície
      const repeatValue = surfaceKey === 'floor' ? 4 : surfaceKey === 'ceiling' ? 3 : 2;
      texture.repeat.set(repeatValue, repeatValue);

      // Configurações de filtro para máxima qualidade
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = 16; // Máxima anisotropia para texturas nítidas

      // Configurações específicas por tipo de textura
      if (textureType === 'normal') {
        texture.colorSpace = THREE.NoColorSpace;
      } else if (textureType === 'diffuse') {
        texture.colorSpace = THREE.SRGBColorSpace;
      } else {
        texture.colorSpace = THREE.NoColorSpace;
      }

      texture.needsUpdate = true;
      return texture;
    };

    // Carregar mapa difuso (obrigatório)
    if (textureData.textureUrls.diffuse) {
      const diffuseTexture = loader.load(textureData.textureUrls.diffuse);
      material.map = configureTexture(diffuseTexture, 'diffuse');
    }

    // Carregar mapa normal
    if (textureData.textureUrls.normal) {
      const normalTexture = loader.load(textureData.textureUrls.normal);
      material.normalMap = configureTexture(normalTexture, 'normal');
      material.normalScale = new THREE.Vector2(0.8, 0.8); // Intensidade suave para decoração
    }

    // Carregar mapa de rugosidade
    if (textureData.textureUrls.roughness) {
      const roughnessTexture = loader.load(textureData.textureUrls.roughness);
      material.roughnessMap = configureTexture(roughnessTexture, 'roughness');
      material.roughness = 1.0; // Use texture value
    }

    // Carregar mapa metálico
    if (textureData.textureUrls.metallic) {
      const metallicTexture = loader.load(textureData.textureUrls.metallic);
      material.metalnessMap = configureTexture(metallicTexture, 'metallic');
      material.metalness = 1.0; // Use texture value
    }

    // Carregar mapa de oclusão ambiente (AO)
    if (textureData.textureUrls.ao) {
      const aoTexture = loader.load(textureData.textureUrls.ao);
      material.aoMap = configureTexture(aoTexture, 'ao');
      material.aoMapIntensity = 0.8; // Intensidade suave para não escurecer demais
    }

    // Carregar mapa de displacement
    if (textureData.textureUrls.displacement) {
      const displacementTexture = loader.load(textureData.textureUrls.displacement);
      material.displacementMap = configureTexture(displacementTexture, 'displacement');
      material.displacementScale = 0.05; // Escala reduzida para decoração
      material.displacementBias = -0.02;
    }

    material.needsUpdate = true;
    return material;
  };

  // Limpar textura
  const clearFloorTexture = () => {
    const newTextures = { ...roomTextures, floor: null };
    saveTextures(newTextures);
  };

  const clearCeilingTexture = () => {
    const newTextures = { ...roomTextures, ceiling: null };
    saveTextures(newTextures);
  };

  const clearWallTexture = (wallId: string) => {
    const newTextures = {
      ...roomTextures,
      walls: { ...roomTextures.walls, [wallId]: null }
    };
    saveTextures(newTextures);
  };

  // Limpar todas as texturas do quarto
  const clearAllTextures = () => {
    const newTextures = {
      floor: null,
      walls: {},
      ceiling: null
    };
    saveTextures(newTextures);

    // Forçar re-render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('roomTextureUpdate'));
      window.dispatchEvent(new CustomEvent('forceRoomUpdate'));
    }, 100);
  };

  return {
    roomTextures,
    applyFloorTexture,
    applyCeilingTexture,
    applyWallTexture,
    clearFloorTexture,
    clearCeilingTexture,
    clearWallTexture,
    clearAllTextures,
    createMaterialFromTexture
  };
};
