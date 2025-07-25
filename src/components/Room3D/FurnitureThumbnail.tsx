import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Package } from 'lucide-react';

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
    return <primitive object={scene.clone()} scale={0.8} />;
  } catch (error) {
    return null;
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
  // Se o modelo não existe ou é um placeholder, mostrar ícone
  if (!modelPath || modelPath.includes('/models/')) {
    return (
      <div 
        className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-300"
        style={{ width, height }}
      >
        {fallbackIcon || <Package size={width * 0.4} className="text-gray-400" />}
      </div>
    );
  }

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden border border-gray-200"
      style={{ width, height }}
    >
      <Canvas
        camera={{ position: [1.5, 1.5, 1.5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={<FallbackGeometry />}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 2, 2]} intensity={0.6} />
          
          <Model modelPath={modelPath} />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Preload para modelos comuns (apenas se existirem)
try {
  useGLTF.preload('/models/sofa.glb');
  useGLTF.preload('/models/coffee-table.glb');
  useGLTF.preload('/models/armchair.glb');
} catch (error) {
  // Ignorar erros de preload
}
