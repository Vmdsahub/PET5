import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Vector3, Raycaster, Plane } from 'three';
import { FurnitureItem } from '../../services/mockStorage';

interface FurnitureObjectProps {
  furniture: FurnitureItem;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onMove: (id: string, position: [number, number, number], rotation?: [number, number, number]) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

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
      <meshStandardMaterial 
        color={getColor()} 
        roughness={0.7}
        metalness={0.1}
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
  onDragEnd
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(new Vector3());
  const { camera, gl, scene } = useThree();
  
  // Estado para controlar se deve tentar carregar o modelo GLB
  const [hasError, setHasError] = useState(false);
  const [shouldLoadModel, setShouldLoadModel] = useState(true);

  let gltfScene = null;
  try {
    if (shouldLoadModel && !hasError) {
      const gltf = useGLTF(furniture.model);
      gltfScene = gltf.scene;
    }
  } catch (error) {
    console.warn(`Falha ao carregar modelo ${furniture.model}:`, error);
    if (shouldLoadModel) {
      setHasError(true);
      setShouldLoadModel(false);
    }
  }

  const plane = new Plane(new Vector3(0, 1, 0), 0);
  const raycaster = new Raycaster();

  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    onSelect(furniture.id);
    
    if (selected && meshRef.current) {
      setIsDragging(true);
      onDragStart();
      
      // Calcular offset do mouse para a posição do objeto
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
    if (!isDragging || !meshRef.current) return;

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
    newPosition.y = furniture.position[1]; // Manter Y original
    
    meshRef.current.position.copy(newPosition);
  };

  const handlePointerUp = () => {
    if (isDragging && meshRef.current) {
      setIsDragging(false);
      onDragEnd();
      
      const position = meshRef.current.position;
      onMove(furniture.id, [position.x, position.y, position.z]);
    }
  };

  useEffect(() => {
    if (isDragging) {
      const canvas = gl.domElement;
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging]);

  return (
    <group
      ref={meshRef}
      position={furniture.position}
      rotation={furniture.rotation}
      scale={furniture.scale}
      onPointerDown={handlePointerDown}
      castShadow
      receiveShadow
    >
      {/* Contorno de seleção */}
      {selected && (
        <mesh>
          <boxGeometry args={[2.2, 1.2, 1.2]} />
          <meshBasicMaterial 
            color="#00ff00" 
            wireframe 
            transparent 
            opacity={0.5}
          />
        </mesh>
      )}
      
      {/* Modelo 3D ou geometria fallback */}
      <mesh castShadow receiveShadow>
        <FallbackGeometry furniture={furniture} />
      </mesh>
      
      {/* Indicador de nome */}
      {selected && (
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
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
