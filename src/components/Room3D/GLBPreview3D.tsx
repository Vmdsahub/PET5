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
  const gltf = useLoader(GLTFLoader, url);

  if (!gltf || !gltf.scene) {
    console.warn('GLTF scene não encontrada');
    return null;
  }

  console.log('Modelo carregado com sucesso:', gltf);

  // Centralizar e escalar o modelo
  const scene = gltf.scene.clone();
  scene.traverse((child) => {
    if ((child as any).isMesh) {
      (child as any).castShadow = true;
      (child as any).receiveShadow = true;
    }
  });

  return <primitive object={scene} scale={0.5} position={[0, -0.5, 0]} />;
};

const ModelWrapper: React.FC<ModelProps> = ({ url }) => {
  try {
    return <Model url={url} />;
  } catch (error) {
    console.error('Erro ao renderizar modelo:', error);
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }
};

export const GLBPreview3D: React.FC<GLBPreview3DProps> = ({
  file,
  width = 200,
  height = 200
}) => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (file) {
      setIsLoading(true);
      setError(null);

      // Verificar se é realmente um arquivo GLB
      if (file.size === 0) {
        setError('Arquivo vazio');
        setIsLoading(false);
        return;
      }

      // Verificar extensão do arquivo
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.glb') && file.type !== 'model/gltf-binary') {
        setError('Arquivo deve ser .glb');
        setIsLoading(false);
        return;
      }

      try {
        const url = URL.createObjectURL(file);
        console.log('URL criada para arquivo:', fileName, url);
        setModelUrl(url);

        // Timeout para dar tempo do modelo carregar
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Erro ao criar URL do arquivo:', err);
        setError('Erro ao processar arquivo');
        setIsLoading(false);
      }
    } else {
      setModelUrl(null);
      setIsLoading(false);
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
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="gray" />
          </mesh>
        }>
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

          {modelUrl && <ModelWrapper url={modelUrl} />}

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
        {isLoading && (
          <div className="bg-blue-500/80 text-white text-xs px-3 py-2 rounded-lg flex items-center space-x-2">
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Carregando...</span>
          </div>
        )}
        {error && (
          <div className="bg-red-500/80 text-white text-xs px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
