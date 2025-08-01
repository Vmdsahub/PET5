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
