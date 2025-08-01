import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LightingSettings } from './LightingControls';

interface LightHelpersProps {
  lightingSettings: LightingSettings;
  show: boolean;
}

export const LightHelpers: React.FC<LightHelpersProps> = ({ lightingSettings, show }) => {
  if (!show) return null;

  return (
    <group>
      {/* Indicador de luz ambiente - apenas informativo */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color={lightingSettings.ambientColor} opacity={0.5} transparent={true} />
      </mesh>

      {/* Texto indicando que apenas luz ambiente está ativa */}
      <group position={[0, 1, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color={lightingSettings.ambientColor} />
        </mesh>
      </group>

      {/* Nota visual sobre realismo físico */}
      <group position={[2, 3, 2]}>
        <mesh>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color={0x4444ff} />
        </mesh>
      </group>
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
