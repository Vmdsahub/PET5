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
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!show) return;

    // Atualizar helper da luz direcional
    if (directionalHelperRef.current && directionalLightRef.current) {
      directionalHelperRef.current.update();
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

      {/* Linha mostrando trajeto da luz direcional */}
      <TrajectoryLine
        start={lightingSettings.directionalPosition}
        end={[0, 0, 0]} // Centro do quarto
        color={0xffa500}
      />

      {/* Marcador de posição da luz direcional */}
      <PositionMarker
        position={lightingSettings.directionalPosition}
        color={0xffa500}
        label="☀️"
      />

      {/* Indicador de luz ambiente no centro */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color={lightingSettings.ambientColor} opacity={0.3} transparent={true} />
      </mesh>
    </group>
  );
};

// Componente para desenhar linhas de trajeto
const TrajectoryLine: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  color: number;
}> = ({ start, end, color }) => {
  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, opacity: 0.8, transparent: true });

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
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Cruz indicativa */}
      <group>
        {/* Linha X */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.03, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {/* Linha Y */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.6, 0.03, 0.03]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {/* Linha Z */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.03, 0.03, 0.6]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
    </group>
  );
};
