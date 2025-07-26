import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Vector3, Raycaster, Plane } from 'three';
import * as THREE from 'three';
import { FurnitureItem } from '../../services/mockStorage';
import { blobCache } from '../../utils/blobCache';

interface FurnitureObjectProps {
  furniture: FurnitureItem;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onMove: (id: string, position: [number, number, number], rotation?: [number, number, number]) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  editMode?: boolean;
  onContextMenu?: (event: React.MouseEvent, furnitureId: string) => void;
  onUpdateTransform?: (id: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void;
  isAdmin?: boolean;
  onUpdateCatalogItem?: (furnitureId: string, newScale: [number, number, number]) => void;
}

// 2D Scale Controls Component
const ScaleControls: React.FC<{
  furniture: FurnitureItem;
  meshRef: React.RefObject<THREE.Group>;
  onUpdateTransform?: (id: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void;
  onUpdateCatalogItem?: (furnitureId: string, newScale: [number, number, number]) => void;
  isAdmin?: boolean;
}> = ({ furniture, meshRef, onUpdateTransform, onUpdateCatalogItem, isAdmin }) => {
  const [scaleX, setScaleX] = useState(furniture.scale?.[0] || 1);
  const [scaleY, setScaleY] = useState(furniture.scale?.[1] || 1);
  const [scaleZ, setScaleZ] = useState(furniture.scale?.[2] || 1);

  const updateScale = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!meshRef.current) return;

    const newScale = {
      x: axis === 'x' ? value : scaleX,
      y: axis === 'y' ? value : scaleY,
      z: axis === 'z' ? value : scaleZ
    };

    setScaleX(newScale.x);
    setScaleY(newScale.y);
    setScaleZ(newScale.z);

    meshRef.current.scale.set(newScale.x, newScale.y, newScale.z);

    if (onUpdateTransform) {
      const position = meshRef.current.position;
      const rotation = meshRef.current.rotation;
      onUpdateTransform(furniture.id,
        [position.x, position.y, position.z],
        [rotation.x, rotation.y, rotation.z],
        [newScale.x, newScale.y, newScale.z]
      );
    }

    if (isAdmin && onUpdateCatalogItem) {
      onUpdateCatalogItem(furniture.id, [newScale.x, newScale.y, newScale.z]);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm p-4 rounded-lg border border-white/20 z-50">
      <div className="text-white text-sm mb-3 font-medium">Escala do Móvel</div>
      <div className="flex gap-6">
        {/* Slider X */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-blue-400 mb-2 font-medium">X</div>
          <div className="relative h-32 w-6">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scaleX}
              onChange={(e) => updateScale('x', parseFloat(e.target.value))}
              className="slider-vertical h-full w-full appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
          </div>
          <div className="text-xs text-white/70 mt-2">{scaleX.toFixed(1)}</div>
        </div>

        {/* Slider Y */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-red-400 mb-2 font-medium">Y</div>
          <div className="relative h-32 w-6">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scaleY}
              onChange={(e) => updateScale('y', parseFloat(e.target.value))}
              className="slider-vertical h-full w-full appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
          </div>
          <div className="text-xs text-white/70 mt-2">{scaleY.toFixed(1)}</div>
        </div>

        {/* Slider Z */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-green-400 mb-2 font-medium">Z</div>
          <div className="relative h-32 w-6">
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scaleZ}
              onChange={(e) => updateScale('z', parseFloat(e.target.value))}
              className="slider-vertical h-full w-full appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical'
              }}
            />
          </div>
          <div className="text-xs text-white/70 mt-2">{scaleZ.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
};

// Componente fallback para quando o modelo GLB não estiver disponível
const FallbackGeometry: React.FC<{ furniture: FurnitureItem }> = ({ furniture }) => {
  const getGeometry = () => {
    switch (furniture.category) {
      case 'sala':
        return <boxGeometry args={[2, 0.8, 1]} />;
      case 'quarto':
        return <boxGeometry args={[2, 0.5, 1.5]} />;
      case 'cozinha':
        return <boxGeometry args={[1.5, 0.8, 1.5]} />;
      case 'decoração':
        return <cylinderGeometry args={[0.3, 0.3, 1.5]} />;
      case 'iluminação':
        return <cylinderGeometry args={[0.2, 0.4, 1.2]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const getColor = () => {
    switch (furniture.category) {
      case 'sala':
        return '#8B4513';
      case 'quarto':
        return '#DEB887';
      case 'cozinha':
        return '#696969';
      case 'decoração':
        return '#228B22';
      case 'iluminação':
        return '#FFD700';
      default:
        return '#A0A0A0';
    }
  };

  return (
    <>
      {getGeometry()}
      <meshLambertMaterial
        color={getColor()}
      />
    </>
  );
};

export const FurnitureObject: React.FC<FurnitureObjectProps> = ({
  furniture,
  selected,
  onSelect,
  onMove,
  onDragStart,
  onDragEnd,
  editMode = false,
  onContextMenu,
  onUpdateTransform,
  isAdmin = false,
  onUpdateCatalogItem
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(new Vector3());
  const [editTool, setEditTool] = useState<'move' | 'rotate' | 'scale' | 'scaleX' | 'scaleY' | 'scaleZ' | null>('move');
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialTransform, setInitialTransform] = useState({
    position: new Vector3(),
    rotation: new Vector3(),
    scale: new Vector3()
  });
  const { camera, gl, scene } = useThree();

  // Estado para controlar carregamento do modelo GLB
  const [hasError, setHasError] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Componente para modelo GLB com error boundary
  const ModelComponent = () => {
    if (!furniture.model || hasError) {
      return <FallbackGeometry furniture={furniture} />;
    }

    // Verificar se é uma URL de blob válida
    if (furniture.model.startsWith('blob:') && !blobCache.isValidUrl(furniture.model)) {
      console.warn(`URL de blob inválida: ${furniture.model}`);
      // Use useEffect to set error state to avoid setState during render
      useEffect(() => {
        setHasError(true);
      }, []);
      return <FallbackGeometry furniture={furniture} />;
    }

    try {
      const { scene } = useGLTF(furniture.model, undefined, undefined, (error) => {
        console.warn(`Erro ao carregar modelo ${furniture.model}:`, error);
        // This callback is already async, so it's safe to call setState here
        setHasError(true);
      });

      if (scene) {
        const clonedScene = scene.clone();

        // Calcular bounding box para escalar adequadamente
        const box = new THREE.Box3().setFromObject(clonedScene);
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 0) {
          const scale = 1.5 / maxDimension;
          clonedScene.scale.setScalar(scale);
        }

        // Use useEffect to set model loaded state to avoid setState during render
        useEffect(() => {
          setModelLoaded(true);
        }, []);
        return <primitive object={clonedScene} />;
      }
    } catch (error) {
      console.warn(`Falha ao renderizar modelo ${furniture.model}:`, error);
      // Use useEffect to set error state to avoid setState during render
      useEffect(() => {
        setHasError(true);
      }, []);
    }

    return <FallbackGeometry furniture={furniture} />;
  };

  const plane = new Plane(new Vector3(0, 1, 0), 0);
  const raycaster = new Raycaster();

  const handlePointerDown = (event: any) => {
    event.stopPropagation();

    // Apenas selecionar se não estiver em modo edição
    if (!editMode) {
      onSelect(furniture.id);
      return;
    }

    // Modo edição ativo - permitir interação
    onSelect(furniture.id);

    // Em modo edição, sempre permitir movimento do móvel
    if (selected && meshRef.current && editMode) {
      setInitialMousePos({ x: event.clientX, y: event.clientY });
      setInitialTransform({
        position: meshRef.current.position.clone(),
        rotation: new Vector3(meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z),
        scale: meshRef.current.scale.clone()
      });

      setIsDragging(true);
      onDragStart();

      // Calcular offset para movimento
      const mousePosition = new Vector3(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0
      );

      raycaster.setFromCamera(mousePosition, camera);
      const intersectPoint = new Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);

      const objectPosition = meshRef.current.position;
      setDragOffset(objectPosition.clone().sub(intersectPoint));
    }
  };

  const handlePointerMove = (event: any) => {
    if (!meshRef.current || !editMode || !isDragging) return;

    if (editTool === 'move') {
      const mousePosition = new Vector3(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
        0
      );

      raycaster.setFromCamera(mousePosition, camera);
      const intersectPoint = new Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);

      const newPosition = intersectPoint.add(dragOffset);

      // Limitar posição dentro do quarto (10x10)
      newPosition.x = Math.max(-4.5, Math.min(4.5, newPosition.x));
      newPosition.z = Math.max(-4.5, Math.min(4.5, newPosition.z));
      newPosition.y = 0; // Manter móveis no chão

      meshRef.current.position.copy(newPosition);
    } else if (editTool === 'rotate') {
      const deltaX = event.clientX - initialMousePos.x;
      const rotationSpeed = 0.01;
      const newRotationY = initialTransform.rotation.y + (deltaX * rotationSpeed);
      meshRef.current.rotation.y = newRotationY;
    } else if (editTool === 'scaleX') {
      // Escala X - movimento horizontal mais responsivo
      const deltaX = event.clientX - initialMousePos.x;
      const scaleSpeed = 0.008;
      const newScaleX = Math.max(0.1, Math.min(4, initialTransform.scale.x + (deltaX * scaleSpeed)));
      meshRef.current.scale.x = newScaleX;
    } else if (editTool === 'scaleY') {
      // Escala Y - movimento vertical mais responsivo
      const deltaY = initialMousePos.y - event.clientY;
      const scaleSpeed = 0.008;
      const newScaleY = Math.max(0.1, Math.min(4, initialTransform.scale.y + (deltaY * scaleSpeed)));
      meshRef.current.scale.y = newScaleY;
    } else if (editTool === 'scaleZ') {
      // Escala Z - movimento horizontal para profundidade
      const deltaX = event.clientX - initialMousePos.x;
      const scaleSpeed = 0.008;
      const newScaleZ = Math.max(0.1, Math.min(4, initialTransform.scale.z + (deltaX * scaleSpeed)));
      meshRef.current.scale.z = newScaleZ;
    } else if (editTool === 'scale') {
      // Escala uniforme (mantido para compatibilidade)
      const deltaY = initialMousePos.y - event.clientY;
      const scaleSpeed = 0.003;
      const newScale = Math.max(0.1, Math.min(3, initialTransform.scale.x + (deltaY * scaleSpeed)));
      meshRef.current.scale.setScalar(newScale);
    }
  };

  const handlePointerUp = () => {
    if (meshRef.current && isDragging && editMode) {
      setIsDragging(false);
      const currentEditTool = editTool;
      // Resetar para modo move para permitir movimento contínuo
      setEditTool('move');
      onDragEnd();

      const position = meshRef.current.position;
      const rotation = meshRef.current.rotation;
      const scale = meshRef.current.scale;

      if (onUpdateTransform) {
        onUpdateTransform(furniture.id,
          [position.x, position.y, position.z],
          [rotation.x, rotation.y, rotation.z],
          [scale.x, scale.y, scale.z]
        );
      }

      // Se admin alterou escala, persistir no catálogo
      if (isAdmin && (currentEditTool === 'scaleX' || currentEditTool === 'scaleY' || currentEditTool === 'scaleZ') && onUpdateCatalogItem) {
        onUpdateCatalogItem(furniture.id, [scale.x, scale.y, scale.z]);
      }
    }
  };

  useEffect(() => {
    if (isDragging && editMode) {
      const canvas = gl.domElement;
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);

      return () => {
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, editMode, editTool]);

  // Funções para botões de modo de edição
  const handleMoveMode = () => {
    setEditTool('move');
    setIsDragging(false);
  };
  const handleRotateMode = () => {
    setEditTool('rotate');
  };
  const handleScaleMode = () => {
    setEditTool('scale');
  };
  const handleScaleXMode = () => {
    setEditTool('scaleX');
  };
  const handleScaleYMode = () => {
    setEditTool('scaleY');
  };
  const handleScaleZMode = () => {
    setEditTool('scaleZ');
  };

  return (
    <group
      ref={meshRef}
      position={furniture.position}
      rotation={furniture.rotation}
      scale={furniture.scale}
      onPointerDown={handlePointerDown}
onContextMenu={(e) => {
        e?.stopPropagation?.();
        e?.preventDefault?.();
        if (onContextMenu) {
          onContextMenu(e, furniture.id);
        }
      }}
      castShadow
      receiveShadow
    >
      {/* Contorno de seleção removido conforme solicitado */}

      {/* Controles de edição intuitivos - apenas para admins */}
      {selected && editMode && isAdmin && (
        <>
          {/* Círculo branco opaco para rotação */}
          <mesh
            position={[0, 0.1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleRotateMode();
              setInitialMousePos({ x: e.clientX, y: e.clientY });
              setInitialTransform({
                position: meshRef.current!.position.clone(),
                rotation: new Vector3(meshRef.current!.rotation.x, meshRef.current!.rotation.y, meshRef.current!.rotation.z),
                scale: meshRef.current!.scale.clone()
              });
              setEditTool('rotate');
              setIsDragging(true);
              onDragStart();
            }}
          >
            <torusGeometry args={[1.2, 0.05, 8, 32]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.7}
            />
          </mesh>


        </>
      )}
      
      {/* Modelo 3D ou geometria fallback */}
      <Suspense fallback={
        <mesh>
          <FallbackGeometry furniture={furniture} />
        </mesh>
      }>
        <ModelComponent />
      </Suspense>

      {/* 2D Scale Controls Portal */}
      {selected && editMode && isAdmin && typeof window !== 'undefined' && createPortal(
        <ScaleControls
          furniture={furniture}
          meshRef={meshRef}
          onUpdateTransform={onUpdateTransform}
          onUpdateCatalogItem={onUpdateCatalogItem}
          isAdmin={isAdmin}
        />,
        document.body
      )}
    </group>
  );
};

// Para usar modelos GLB reais, descomente as linhas abaixo:
// useGLTF.preload('/models/sofa.glb');
// useGLTF.preload('/models/coffee-table.glb');
// useGLTF.preload('/models/armchair.glb');
// useGLTF.preload('/models/bookshelf.glb');
// useGLTF.preload('/models/bed.glb');
// useGLTF.preload('/models/wardrobe.glb');
// useGLTF.preload('/models/dining-table.glb');
// useGLTF.preload('/models/chair.glb');
// useGLTF.preload('/models/plant.glb');
// useGLTF.preload('/models/lamp.glb');
