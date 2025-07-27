import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Room } from './Room';
import { FurnitureObject } from './FurnitureObject';
import { ScaleControls } from './ScaleControls';
import { mockStorageService, FurnitureItem } from '../../services/mockStorage';
import { RoomUI } from './RoomUI';
import { WebGLFallback } from './WebGLFallback';
import { Room2DFallback } from './Room2DFallback';
import { detectWebGLSupport, getWebGLErrorMessage } from '../../utils/webglDetection';

interface Room3DProps {
  userId: string;
  isAdmin?: boolean;
}

export const Room3D: React.FC<Room3DProps> = ({ userId, isAdmin = false }) => {
  const [webglSupport, setWebglSupport] = useState<ReturnType<typeof detectWebGLSupport> | null>(null);
  const [use2DMode, setUse2DMode] = useState(false);
  const [placedFurniture, setPlacedFurniture] = useState<FurnitureItem[]>(
    mockStorageService.getPlacedFurniture(userId)
  );
  const [inventory, setInventory] = useState<FurnitureItem[]>(
    mockStorageService.getInventory(userId)
  );
  const [catalog, setCatalog] = useState(mockStorageService.getFurnitureCatalog());
  const [selectedFurniture, setSelectedFurniture] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [contextMenuState, setContextMenuState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    furnitureId: string | null;
  }>({ visible: false, x: 0, y: 0, furnitureId: null });
  const [catalogUpdateNotification, setCatalogUpdateNotification] = useState<string | null>(null);
  const controlsRef = useRef<any>();
  const cameraRef = useRef<THREE.Camera>();
  const furnitureRefs = useRef<{ [key: string]: React.RefObject<THREE.Group> }>({});

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

  const handleAddFurniture = (furnitureData: any) => {
    mockStorageService.addCustomFurniture(furnitureData);
    // Recarregar catálogo para mostrar o novo móvel
    setCatalog(mockStorageService.getFurnitureCatalog());
  };

  const handleToggleEditMode = () => {
    setEditMode(!editMode);
    setSelectedFurniture(null);
  };

  const handleStoreFurniture = (furnitureId: string) => {
    if (mockStorageService.removeFurniture(userId, furnitureId)) {
      setPlacedFurniture(mockStorageService.getPlacedFurniture(userId));
      setInventory(mockStorageService.getInventory(userId));
      setSelectedFurniture(null);
    }
  };

  const handleUpdateTransform = (id: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => {
    mockStorageService.updateFurnitureTransform(userId, id, position, rotation, scale);
    setPlacedFurniture(mockStorageService.getPlacedFurniture(userId));
  };

  const handleUpdateCatalogItem = (furnitureId: string, newScale: [number, number, number]) => {
    if (mockStorageService.updateCatalogItemScale(furnitureId, newScale)) {
      // Recarregar catálogo para refletir mudanças
      setCatalog(mockStorageService.getFurnitureCatalog());

      // Mostrar notificação
      setCatalogUpdateNotification('Escala atualizada permanentemente no catálogo!');
      setTimeout(() => setCatalogUpdateNotification(null), 3000);
    }
  };

  const handleContextMenu = (event: any, furnitureId: string) => {
    setContextMenuState({
      visible: true,
      x: event.clientX || window.innerWidth / 2,
      y: event.clientY || window.innerHeight / 2,
      furnitureId
    });
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
      <div className="w-full h-screen relative" style={{
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(50, 80, 150, 0.4) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(70, 120, 180, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 40% 80%, rgba(60, 100, 160, 0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 70%, rgba(40, 90, 140, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, #1a2845 0%, #0f1c38 40%, #0a1228 70%, #050a18 100%)
        `
      }}>
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
          isAdmin={isAdmin}
          onAddFurniture={handleAddFurniture}
          editMode={editMode}
          onToggleEditMode={handleToggleEditMode}
          onStoreFurniture={handleStoreFurniture}
          contextMenuState={contextMenuState}
          onCloseContextMenu={() => setContextMenuState({ visible: false, x: 0, y: 0, furnitureId: null })}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative" style={{
      background: `
        radial-gradient(ellipse at 20% 30%, rgba(50, 80, 150, 0.4) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(70, 120, 180, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 40% 80%, rgba(60, 100, 160, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 70% 70%, rgba(40, 90, 140, 0.2) 0%, transparent 50%),
        linear-gradient(135deg, #1a2845 0%, #0f1c38 40%, #0a1228 70%, #050a18 100%)
      `
    }}>
      {/* Botão para alternar para modo 2D */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setUse2DMode(true)}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors"
          title="Alternar para modo 2D"
        >
          📱 Modo 2D
        </button>
      </div>

      {/* Notificação de atualização do catálogo */}
      {catalogUpdateNotification && (
        <div className="absolute top-20 right-4 z-30 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <span>✓</span>
            <span>{catalogUpdateNotification}</span>
          </div>
        </div>
      )}

      {/* Canvas 3D */}
      <Canvas
        camera={{
          position: [8, 8, 8],
          fov: 50,
          near: 0.1,
          far: 100
        }}
        className="w-full h-full"
        onCreated={(state) => {
          console.log('Canvas 3D criado com sucesso');
          state.gl.setClearColor('#1a2845', 1);
          cameraRef.current = state.camera;
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
          {/* Iluminação Simples e Estável */}
          <ambientLight intensity={0.6} color="#ffffff" />
          <directionalLight
            position={[0, 10, 0]}
            intensity={0.8}
            color="#ffffff"
            castShadow={false}
          />
          <pointLight
            position={[0, 4, 0]}
            intensity={0.3}
            color="#fff8dc"
            distance={15}
            decay={2}
          />
          
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
          
          {/* Quarto */}
          <Room />

          {/* Móveis colocados */}
          {placedFurniture.map((furniture) => {
            // Create ref for this furniture if it doesn't exist
            if (!furnitureRefs.current[furniture.id]) {
              furnitureRefs.current[furniture.id] = React.createRef<THREE.Group>();
            }

            return (
              <FurnitureObject
                key={furniture.id}
                furniture={furniture}
                selected={selectedFurniture === furniture.id}
                onSelect={handleFurnitureSelect}
                onMove={handleMoveFurniture}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                editMode={editMode}
                onUpdateTransform={handleUpdateTransform}
                onContextMenu={handleContextMenu}
                isAdmin={isAdmin}
                onUpdateCatalogItem={handleUpdateCatalogItem}
                meshRef={furnitureRefs.current[furniture.id]}
              />
            );
          })}
        </Suspense>
      </Canvas>

      {/* Scale Controls - Outside Canvas for 2D UI */}
      {selectedFurniture && editMode && isAdmin && (
        <ScaleControls
          furniture={placedFurniture.find(f => f.id === selectedFurniture)!}
          meshRef={furnitureRefs.current[selectedFurniture]}
          onUpdateTransform={handleUpdateTransform}
          onUpdateCatalogItem={handleUpdateCatalogItem}
          isAdmin={isAdmin}
          visible={true}
        />
      )}

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
        isAdmin={isAdmin}
        onAddFurniture={handleAddFurniture}
        editMode={editMode}
        onToggleEditMode={handleToggleEditMode}
        onStoreFurniture={handleStoreFurniture}
        contextMenuState={contextMenuState}
        onCloseContextMenu={() => setContextMenuState({ visible: false, x: 0, y: 0, furnitureId: null })}
      />
    </div>
  );
};
