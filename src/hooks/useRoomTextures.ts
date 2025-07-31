import { useState, useEffect } from 'react';
import * as THREE from 'three';

// Cache global de texturas e loader singleton para máxima performance
const globalTextureCache = new Map<string, THREE.Texture>();
const globalLoaderManager = new THREE.LoadingManager();
const globalLoader = new THREE.TextureLoader(globalLoaderManager);

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

  // Cache de texturas para evitar recarregamentos
  const textureCache = new Map<string, THREE.Texture>();
  const loaderManager = new THREE.LoadingManager();
  const loader = new THREE.TextureLoader(loaderManager);

  // Cleanup otimizado
  useEffect(() => {
    return () => {
      // Limpar timeout do debounce
      if (saveTexturesDebounced.current) {
        clearTimeout(saveTexturesDebounced.current);
      }
      // Cache global mantido para reutilização entre componentes
    };
  }, []);

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

  // Debounce para saveTextures
  const saveTexturesDebounced = useRef<NodeJS.Timeout>();

  // Salvar texturas no localStorage de forma assíncrona
  const saveTextures = (newTextures: RoomTextures) => {
    setRoomTextures(newTextures);

    // Salvar no localStorage com debounce para evitar travamentos
    if (saveTexturesDebounced.current) {
      clearTimeout(saveTexturesDebounced.current);
    }

    saveTexturesDebounced.current = setTimeout(() => {
      requestIdleCallback(() => {
        localStorage.setItem(`room_textures_${userId}`, JSON.stringify(newTextures));
      });
    }, 200);
  };

  // Função otimizada para dispatch único
  const triggerRoomUpdate = () => {
    // Usar requestAnimationFrame para otimizar performance
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('roomTextureUpdate'));
    });
  };

  // Aplicar textura ao chão
  const applyFloorTexture = (textureData: TextureData) => {
    const newTextures = {
      ...roomTextures,
      floor: textureData
    };
    saveTextures(newTextures);
    triggerRoomUpdate();
  };

  // Aplicar textura ao teto
  const applyCeilingTexture = (textureData: TextureData) => {
    const newTextures = {
      ...roomTextures,
      ceiling: textureData
    };
    saveTextures(newTextures);
    triggerRoomUpdate();
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
    triggerRoomUpdate();
  };

  // Criar material Three.js a partir dos dados da textura
  const createMaterialFromTexture = (textureData: TextureData | null, defaultColor: string = '#ffffff', surfaceKey?: string) => {
    if (!textureData || !textureData.textureUrls.diffuse) {
      return new THREE.MeshLambertMaterial({
        color: defaultColor,
        name: `default_${surfaceKey || 'surface'}`
      });
    }

    // Usar nome consistente sem timestamp para evitar recriações
    const materialName = `texture_${surfaceKey || 'surface'}_${textureData.id || 'custom'}`;

    // Criar material PBR completo
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.8,
      metalness: 0.1,
      name: materialName
    });

    // Função helper para carregar texturas com cache global
    const loadTextureAsync = (url: string, textureType: string = 'diffuse'): THREE.Texture => {
      const cacheKey = `${url}_${textureType}`;

      // Verificar cache global primeiro
      if (globalTextureCache.has(cacheKey)) {
        return globalTextureCache.get(cacheKey)!.clone();
      }

      // Carregar textura assincronamente
      const texture = globalLoader.load(url,
        // onLoad - sucesso
        () => {
          // Configurar apenas uma vez quando carregada
          configureTexture(texture, textureType);
        },
        // onProgress - opcional
        undefined,
        // onError
        (error) => {
          console.warn(`Erro ao carregar textura ${url}:`, error);
        }
      );

      // Adicionar ao cache global
      globalTextureCache.set(cacheKey, texture);
      return texture;
    };

    // Fun��ão helper para configurar texturas otimizadas
    const configureTexture = (texture: THREE.Texture, textureType: string = 'diffuse') => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      // Ajustar repeat baseado no tipo de textura e superfície
      const repeatValue = surfaceKey === 'floor' ? 4 : surfaceKey === 'ceiling' ? 3 : 2;
      texture.repeat.set(repeatValue, repeatValue);

      // Configurações de filtro otimizadas
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = 16; // Valor fixo para evitar consultas desnecessárias

      // Configurações específicas por tipo
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

    // Carregar texturas de forma assíncrona e eficiente
    if (textureData.textureUrls.diffuse) {
      material.map = loadTextureAsync(textureData.textureUrls.diffuse, 'diffuse');
    }

    if (textureData.textureUrls.normal) {
      material.normalMap = loadTextureAsync(textureData.textureUrls.normal, 'normal');
      material.normalScale = new THREE.Vector2(0.8, 0.8);
    }

    if (textureData.textureUrls.roughness) {
      material.roughnessMap = loadTextureAsync(textureData.textureUrls.roughness, 'roughness');
      material.roughness = 1.0;
    }

    if (textureData.textureUrls.metallic) {
      material.metalnessMap = loadTextureAsync(textureData.textureUrls.metallic, 'metallic');
      material.metalness = 1.0;
    }

    if (textureData.textureUrls.ao) {
      material.aoMap = loadTextureAsync(textureData.textureUrls.ao, 'ao');
      material.aoMapIntensity = 0.8;
    }

    if (textureData.textureUrls.displacement) {
      material.displacementMap = loadTextureAsync(textureData.textureUrls.displacement, 'displacement');
      material.displacementScale = 0.05;
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

    // Usar requestAnimationFrame para melhor performance
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('roomTextureUpdate'));
      window.dispatchEvent(new CustomEvent('forceRoomUpdate'));
    });
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
