import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { Room } from './Room';
import { FurnitureObject } from './FurnitureObject';
import { mockStorageService, FurnitureItem } from '../../services/mockStorage';
import { RoomUI } from './RoomUI';
import { WebGLFallback } from './WebGLFallback';
import { Room2DFallback } from './Room2DFallback';
import { detectWebGLSupport, getWebGLErrorMessage } from '../../utils/webglDetection';

interface Room3DProps {
  userId: string;
}

export const Room3D: React.FC<Room3DProps> = ({ userId }) => {
  const [webglSupport, setWebglSupport] = useState<ReturnType<typeof detectWebGLSupport> | null>(null);
  const [use2DMode, setUse2DMode] = useState(false);
  const [placedFurniture, setPlacedFurniture] = useState<FurnitureItem[]>(
    mockStorageService.getPlacedFurniture(userId)
  );
  const [inventory, setInventory] = useState<FurnitureItem[]>(
    mockStorageService.getInventory(userId)
  );
  const [catalog] = useState(mockStorageService.getFurnitureCatalog());
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const controlsRef = useRef<any>();

  // Detectar suporte WebGL na montagem do componente
  useEffect(() => {
    const capabilities = detectWebGLSupport();
    setWebglSupport(capabilities);

    if (!capabilities.hasSupport) {
      console.error('WebGL not supported:', capabilities.failureReason);
    }
  }, []);

  const handlePlaceFurniture = (furnitureId: string, position: [number, number, number]) => {
    if (mockStorageService.placeFurniture(userId, furnitureId, position)) {
      setPlacedFurniture(mockStorageService.getPlacedFurniture(userId));
      setInventory(mockStorageService.getInventory(userId));
    }
  };

  const handleMoveFurniture = (furnitureId: string, position: [number, number, number], rotation?: [number, number, number]) => {
    if (mockStorageService.updateFurniturePosition(userId, furnitureId, position, rotation)) {
      setPlacedFurniture(mockStorageService.getPlacedFurniture(userId));
    }
  };

  const handleRemoveFurniture = (furnitureId: string) => {
    if (mockStorageService.removeFurniture(userId, furnitureId)) {
      setPlacedFurniture(mockStorageService.getPlacedFurniture(userId));
      setInventory(mockStorageService.getInventory(userId));
      setSelectedFurniture(null);
    }
  };

  const handleBuyFurniture = (catalogItem: any) => {
    const newItem = mockStorageService.buyFurniture(userId, catalogItem);
    setInventory(mockStorageService.getInventory(userId));
    return newItem;
  };

  const handleFurnitureSelect = (furnitureId: string | null) => {
    setSelectedFurniture(furnitureId);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
    }
  };

  const handleRetryWebGL = () => {
    const capabilities = detectWebGLSupport();
    setWebglSupport(capabilities);
  };

  // Mostrar loading enquanto detecta WebGL
  if (webglSupport === null) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando compatibilidade 3D...</p>
        </div>
      </div>
    );
  }

  // Mostrar fallback se WebGL não for suportado ou modo 2D ativado
  if (!webglSupport.hasSupport || use2DMode) {
    return (
      <div className="w-full h-screen relative bg-gray-100">
        {/* Botão para alternar entre 2D e tentar 3D */}
        <div className="absolute top-4 right-4 z-20 space-x-2">
          {webglSupport.hasSupport && (
            <button
              onClick={() => setUse2DMode(!use2DMode)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors"
            >
              {use2DMode ? '🎮 Modo 3D' : '📱 Modo 2D'}
            </button>
          )}
          {!webglSupport.hasSupport && (
            <button
              onClick={handleRetryWebGL}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors"
            >
              🔄 Tentar 3D
            </button>
          )}
        </div>

        {webglSupport.hasSupport && use2DMode ? (
          <Room2DFallback
            placedFurniture={placedFurniture}
            selectedFurniture={selectedFurniture}
            onSelectFurniture={handleFurnitureSelect}
            onMoveFurniture={handleMoveFurniture}
          />
        ) : (
          <WebGLFallback
            errorMessage={getWebGLErrorMessage(webglSupport)}
            onRetry={handleRetryWebGL}
          />
        )}

        {/* Interface do usuário (funciona em ambos os modos) */}
        <RoomUI
          inventory={inventory}
          catalog={catalog}
          selectedFurniture={selectedFurniture}
          onPlaceFurniture={handlePlaceFurniture}
          onRemoveFurniture={handleRemoveFurniture}
          onBuyFurniture={handleBuyFurniture}
          onSelectFurniture={handleFurnitureSelect}
          isDragging={isDragging}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative bg-gray-100">
      {/* Canvas 3D */}
      <Canvas
        camera={{
          position: [8, 8, 8],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        className="w-full h-full"
        onCreated={(state) => {
          console.log('Canvas 3D criado com sucesso');
        }}
        onError={(error) => {
          console.error('Erro no Canvas 3D:', error);
          setWebglSupport({ hasSupport: false, webgl: false, webgl2: false, failureReason: error.message });
        }}
      >
        <Suspense fallback={
          <Html center>
            <div className="text-white text-xl">Carregando quarto...</div>
          </Html>
        }>
          {/* Iluminação */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <pointLight position={[5, 8, 5]} intensity={0.5} />
          
          {/* Controles de câmera */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2}
            target={[0, 0, 0]}
          />
          
          {/* Ambiente */}
          <Environment preset="apartment" />
          
          {/* Quarto */}
          <Room />
          
          {/* Móveis colocados */}
          {placedFurniture.map((furniture) => (
            <FurnitureObject
              key={furniture.id}
              furniture={furniture}
              selected={selectedFurniture === furniture.id}
              onSelect={handleFurnitureSelect}
              onMove={handleMoveFurniture}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
          
          {/* Sombras de contato */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.4}
            scale={20}
            blur={1}
            far={10}
            resolution={256}
            color="#000000"
          />
        </Suspense>
      </Canvas>

      {/* Interface do usuário */}
      <RoomUI
        inventory={inventory}
        catalog={catalog}
        selectedFurniture={selectedFurniture}
        onPlaceFurniture={handlePlaceFurniture}
        onRemoveFurniture={handleRemoveFurniture}
        onBuyFurniture={handleBuyFurniture}
        onSelectFurniture={handleFurnitureSelect}
        isDragging={isDragging}
      />
    </div>
  );
};
