import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Package } from 'lucide-react';
import * as THREE from 'three';

interface FurnitureThumbnailProps {
  modelPath: string;
  width?: number | string;
  height?: number | string;
  fallbackIcon?: React.ReactNode;
}

interface ModelProps {
  modelPath: string;
}

const Model: React.FC<ModelProps> = ({ modelPath }) => {
  try {
    const { scene } = useGLTF(modelPath);
    const clonedScene = scene.clone();

    // Calcular bounding box para centralizar e escalar adequadamente
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Centralizar o modelo
    clonedScene.position.sub(center);

    // Escalar para caber na thumbnail
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = 1.5 / maxDimension;
    clonedScene.scale.setScalar(scale);

    return <primitive object={clonedScene} />;
  } catch (error) {
    console.warn('Erro ao carregar modelo:', modelPath, error);
    return <FallbackGeometry />;
  }
};

const FallbackGeometry: React.FC = () => {
  return (
    <mesh>
      <boxGeometry args={[1, 0.5, 1]} />
      <meshLambertMaterial color="#8B7355" />
    </mesh>
  );
};

export const FurnitureThumbnail: React.FC<FurnitureThumbnailProps> = ({
  modelPath,
  width = 64,
  height = 64,
  fallbackIcon
}) => {
  // Se o modelo não existe, mostrar ícone
  if (!modelPath) {
    return (
      <div
        className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-300"
        style={{ width, height }}
      >
        {fallbackIcon || <Package size={typeof width === 'number' ? width * 0.4 : 24} className="text-gray-400" />}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden border border-gray-200"
      style={{
        width,
        height,
        background: 'transparent'
      }}
    >
      <Canvas
        camera={{ position: [2, 1.5, 2], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={<FallbackGeometry />}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 3, 3]} intensity={0.7} />
          <directionalLight position={[-2, 2, -2]} intensity={0.3} />

          <Model modelPath={modelPath} />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Limpar cache de modelos ao desmontar
export const clearThumbnailCache = () => {
  useGLTF.clear();
};
