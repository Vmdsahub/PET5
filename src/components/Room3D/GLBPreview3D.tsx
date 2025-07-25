import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Package } from 'lucide-react';

interface GLBPreview3DProps {
  file: File | null;
  width?: number;
  height?: number;
}

interface ModelProps {
  url: string;
}

const Model: React.FC<ModelProps> = ({ url }) => {
  try {
    const gltf = useLoader(GLTFLoader, url);
    console.log('Modelo carregado:', gltf);

    // Centralizar e escalar o modelo
    const scene = gltf.scene.clone();
    scene.traverse((child) => {
      if ((child as any).isMesh) {
        (child as any).castShadow = true;
        (child as any).receiveShadow = true;
      }
    });

    return <primitive object={scene} scale={0.5} position={[0, -0.5, 0]} />;
  } catch (error) {
    console.error('Erro ao carregar modelo:', error);
    return null;
  }
};

export const GLBPreview3D: React.FC<GLBPreview3DProps> = ({ 
  file, 
  width = 200, 
  height = 200 
}) => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setModelUrl(url);
      setError(null);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setModelUrl(null);
    }
  }, [file]);

  if (!file || !modelUrl) {
    return (
      <div 
        className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
        style={{ width, height }}
      >
        <div className="text-center">
          <Package size={32} className="mx-auto mb-2 text-gray-400" />
          <p className="text-xs text-gray-500">Sem preview</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden border border-gray-300"
      style={{ width, height, background: 'transparent' }}
    >
      <Canvas
        camera={{ position: [3, 2, 3], fov: 45, near: 0.1, far: 100 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // Fundo transparente
        }}
      >
        <Suspense fallback={null}>
          {/* Iluminação melhorada */}
          <ambientLight intensity={1.2} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-3, 3, -3]} intensity={0.8} />
          <pointLight position={[3, -2, 3]} intensity={0.6} />

          {modelUrl && <Model url={modelUrl} />}

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={1}
            minDistance={0.5}
            maxDistance={8}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
      
      {/* Overlay de loading/erro */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {error && (
          <div className="bg-red-500/80 text-white text-xs px-2 py-1 rounded">
            Erro ao carregar
          </div>
        )}
      </div>
    </div>
  );
};
