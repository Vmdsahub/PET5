import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LightingSettings } from './LightingControls';

interface LightHelpersProps {
  lightingSettings: LightingSettings;
  show: boolean;
}

export const LightHelpers: React.FC<LightHelpersProps> = ({ lightingSettings, show }) => {
  const directionalHelperRef = useRef<THREE.DirectionalLightHelper>(null);
  const pointHelperRef = useRef<THREE.PointLightHelper>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  
  // Material para as linhas de trajeto
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffff00, 
    opacity: 0.6, 
    transparent: true 
  });
  
  const directionalLineMaterial = new THREE.LineBasicMaterial({ 
    color: 0xffa500, 
    opacity: 0.8, 
    transparent: true 
  });

  useFrame(() => {
    if (!show) return;
    
    // Atualizar helpers se existirem
    if (directionalHelperRef.current && directionalLightRef.current) {
      directionalHelperRef.current.update();
    }
    
    if (pointHelperRef.current && pointLightRef.current) {
      pointHelperRef.current.update();
    }
  });

  if (!show) return null;

  return (
    <group>
      {/* Helper para luz direcional */}
      <directionalLight
        ref={directionalLightRef}
        position={lightingSettings.directionalPosition}
        intensity={lightingSettings.directionalIntensity}
        color={lightingSettings.directionalColor}
        visible={false} // Luz invisível, só para o helper
      />
      
      {directionalLightRef.current && (
        <primitive 
          object={new THREE.DirectionalLightHelper(directionalLightRef.current, 2, 0xffa500)} 
          ref={directionalHelperRef}
        />
      )}

      {/* Helper para luz pontual */}
      <pointLight
        ref={pointLightRef}
        position={lightingSettings.pointPosition}
        intensity={lightingSettings.pointIntensity}
        color={lightingSettings.pointColor}
        distance={lightingSettings.pointDistance}
        decay={lightingSettings.pointDecay}
        visible={false} // Luz invisível, só para o helper
      />
      
      {pointLightRef.current && (
        <primitive 
          object={new THREE.PointLightHelper(pointLightRef.current, 0.5, 0xffff00)} 
          ref={pointHelperRef}
        />
      )}

      {/* Linha mostrando trajeto da luz direcional */}
      <TrajectoryLine
        start={lightingSettings.directionalPosition}
        end={[0, 0, 0]} // Centro do quarto
        material={directionalLineMaterial}
      />

      {/* Esfera mostrando alcance da luz pontual */}
      <mesh position={lightingSettings.pointPosition}>
        <sphereGeometry args={[lightingSettings.pointDistance, 16, 16]} />
        <meshBasicMaterial 
          color={lightingSettings.pointColor} 
          wireframe={true} 
          opacity={0.2} 
          transparent={true} 
        />
      </mesh>

      {/* Linha mostrando posição da luz pontual */}
      <TrajectoryLine
        start={lightingSettings.pointPosition}
        end={[lightingSettings.pointPosition[0], 0, lightingSettings.pointPosition[2]]} // Projeção no chão
        material={lineMaterial}
      />

      {/* Marcadores de posição */}
      <PositionMarker 
        position={lightingSettings.directionalPosition} 
        color={0xffa500}
        label="☀️"
      />
      
      <PositionMarker 
        position={lightingSettings.pointPosition} 
        color={0xffff00}
        label="💡"
      />
    </group>
  );
};

// Componente para desenhar linhas de trajeto
const TrajectoryLine: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  material: THREE.LineBasicMaterial;
}> = ({ start, end, material }) => {
  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ];
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
  return <primitive object={new THREE.Line(geometry, material)} />;
};

// Componente para marcar posições das luzes
const PositionMarker: React.FC<{
  position: [number, number, number];
  color: number;
  label: string;
}> = ({ position, color, label }) => {
  return (
    <group position={position}>
      {/* Esfera pequena como marcador */}
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Cruz indicativa */}
      <group>
        {/* Linha X */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.02, 0.02]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {/* Linha Y */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.4, 0.02, 0.02]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {/* Linha Z */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.02, 0.02, 0.4]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
};
