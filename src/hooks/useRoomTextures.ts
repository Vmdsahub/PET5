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

  // Função para criar textura configurada corretamente
  const createConfiguredTexture = (url: string, repeatX: number = 1, repeatY: number = 1) => {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(url);
    
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.offset.set(0, 0);
    texture.center.set(0.5, 0.5);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.flipY = false;
    texture.needsUpdate = true;
    
    return texture;
  };

  // Criar array de materiais para boxGeometry (6 faces: direita, esquerda, topo, fundo, frente, trás)
  const createMaterialFromTexture = (textureData: TextureData | null, defaultColor: string = '#ffffff', surfaceKey?: string) => {
    // Material padrão para quando não há textura
    const defaultMaterial = new THREE.MeshLambertMaterial({
      color: defaultColor,
      name: `default_${surfaceKey || 'surface'}`
    });

    if (!textureData || !textureData.textureUrls.diffuse) {
      // Retornar array de 6 materiais iguais para boxGeometry
      return [defaultMaterial, defaultMaterial, defaultMaterial, defaultMaterial, defaultMaterial, defaultMaterial];
    }

    // Criar material com textura
    const createTexturedMaterial = () => {
      const material = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.8,
        metalness: 0.1,
        transparent: false,
        name: `texture_${surfaceKey || 'surface'}_${Date.now()}`
      });

      // Carregar mapa difuso
      if (textureData.textureUrls.diffuse) {
        const diffuseTexture = createConfiguredTexture(textureData.textureUrls.diffuse, 1, 1);
        material.map = diffuseTexture;
      }

      // Carregar mapa normal
      if (textureData.textureUrls.normal) {
        const normalTexture = createConfiguredTexture(textureData.textureUrls.normal, 1, 1);
        material.normalMap = normalTexture;
      }

      // Carregar mapa de rugosidade
      if (textureData.textureUrls.roughness) {
        const roughnessTexture = createConfiguredTexture(textureData.textureUrls.roughness, 1, 1);
        material.roughnessMap = roughnessTexture;
      }

      // Carregar mapa de displacement
      if (textureData.textureUrls.displacement) {
        const displacementTexture = createConfiguredTexture(textureData.textureUrls.displacement, 1, 1);
        material.displacementMap = displacementTexture;
        material.displacementScale = 0.1;
      }

      // Carregar mapa metálico
      if (textureData.textureUrls.metallic) {
        const metallicTexture = createConfiguredTexture(textureData.textureUrls.metallic, 1, 1);
        material.metalnessMap = metallicTexture;
      }

      // Carregar mapa AO
      if (textureData.textureUrls.ao) {
        const aoTexture = createConfiguredTexture(textureData.textureUrls.ao, 1, 1);
        material.aoMap = aoTexture;
      }

      material.needsUpdate = true;
      return material;
    };

    // Para chão e teto, aplicar textura apenas na face superior/inferior
    if (surfaceKey === 'floor') {
      const texturedMaterial = createTexturedMaterial();
      // boxGeometry faces: [+x, -x, +y, -y, +z, -z]
      // Para chão rotacionado, queremos textura na face que fica visível
      return [defaultMaterial, defaultMaterial, texturedMaterial, defaultMaterial, defaultMaterial, defaultMaterial];
    }

    if (surfaceKey === 'ceiling') {
      const texturedMaterial = createTexturedMaterial();
      // Para teto rotacionado, queremos textura na face que fica visível
      return [defaultMaterial, defaultMaterial, defaultMaterial, texturedMaterial, defaultMaterial, defaultMaterial];
    }

    // Para paredes, aplicar textura na face principal
    if (surfaceKey?.startsWith('wall')) {
      const texturedMaterial = createTexturedMaterial();
      // Para paredes, aplicar na face frontal
      return [defaultMaterial, defaultMaterial, defaultMaterial, defaultMaterial, texturedMaterial, defaultMaterial];
    }

    // Fallback: aplicar em todas as faces
    const texturedMaterial = createTexturedMaterial();
    return [texturedMaterial, texturedMaterial, texturedMaterial, texturedMaterial, texturedMaterial, texturedMaterial];
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
