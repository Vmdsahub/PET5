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

    // Criar material com cor padrão primeiro para evitar flash preto
    const material = new THREE.MeshStandardMaterial({
      color: defaultColor, // Manter cor padrão enquanto carrega
      roughness: 0.8,
      metalness: 0.1,
      name: `texture_${surfaceKey || 'surface'}_${Date.now()}`
    });

    // Carregar mapa difuso (obrigatório)
    if (textureData.textureUrls.diffuse) {
      const diffuseTexture = loader.load(textureData.textureUrls.diffuse);
      diffuseTexture.wrapS = THREE.RepeatWrapping;
      diffuseTexture.wrapT = THREE.RepeatWrapping;
      diffuseTexture.repeat.set(2, 2); // Ajustar repetição conforme necessário
      diffuseTexture.needsUpdate = true;
      material.map = diffuseTexture;
    }

    // Carregar mapa normal (opcional)
    if (textureData.textureUrls.normal) {
      const normalTexture = loader.load(textureData.textureUrls.normal);
      normalTexture.wrapS = THREE.RepeatWrapping;
      normalTexture.wrapT = THREE.RepeatWrapping;
      normalTexture.repeat.set(2, 2);
      material.normalMap = normalTexture;
    }

    // Carregar mapa de rugosidade (opcional)
    if (textureData.textureUrls.roughness) {
      const roughnessTexture = loader.load(textureData.textureUrls.roughness);
      roughnessTexture.wrapS = THREE.RepeatWrapping;
      roughnessTexture.wrapT = THREE.RepeatWrapping;
      roughnessTexture.repeat.set(2, 2);
      material.roughnessMap = roughnessTexture;
    }

    // Carregar mapa de displacement (opcional)
    if (textureData.textureUrls.displacement) {
      const displacementTexture = loader.load(textureData.textureUrls.displacement);
      displacementTexture.wrapS = THREE.RepeatWrapping;
      displacementTexture.wrapT = THREE.RepeatWrapping;
      displacementTexture.repeat.set(2, 2);
      material.displacementMap = displacementTexture;
      material.displacementScale = 0.1;
    }

    // Carregar mapa metálico (opcional)
    if (textureData.textureUrls.metallic) {
      const metallicTexture = loader.load(textureData.textureUrls.metallic);
      metallicTexture.wrapS = THREE.RepeatWrapping;
      metallicTexture.wrapT = THREE.RepeatWrapping;
      metallicTexture.repeat.set(2, 2);
      material.metalnessMap = metallicTexture;
    }

    // Carregar mapa AO (opcional)
    if (textureData.textureUrls.ao) {
      const aoTexture = loader.load(textureData.textureUrls.ao);
      aoTexture.wrapS = THREE.RepeatWrapping;
      aoTexture.wrapT = THREE.RepeatWrapping;
      aoTexture.repeat.set(2, 2);
      material.aoMap = aoTexture;
    }

    // Forçar atualização do material
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
