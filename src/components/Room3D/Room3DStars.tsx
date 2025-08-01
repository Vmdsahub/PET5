import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface StarData {
  position: [number, number, number];
  size: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

export const Room3DStars: React.FC = () => {
  // Generate star field with depth
  const stars = useMemo<StarData[]>(() => {
    const starArray: StarData[] = [];
    const starCount = 120;

    for (let i = 0; i < starCount; i++) {
      // Create stars in multiple depth layers for better atmosphere
      const layer = Math.random();
      let radius: number;
      let size: number;
      let alpha: number;

      if (layer < 0.4) {
        // Far background stars (smallest, dimmest)
        radius = 60 + Math.random() * 40;
        size = 0.05 + Math.random() * 0.15;
        alpha = 0.3 + Math.random() * 0.4;
      } else if (layer < 0.7) {
        // Mid-distance stars
        radius = 35 + Math.random() * 25;
        size = 0.1 + Math.random() * 0.2;
        alpha = 0.5 + Math.random() * 0.4;
      } else {
        // Closer stars (larger, brighter)
        radius = 25 + Math.random() * 15;
        size = 0.15 + Math.random() * 0.25;
        alpha = 0.7 + Math.random() * 0.3;
      }

      // Random distribution on sphere
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = Math.random() * 2 * Math.PI;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      // Star colors with subtle blue tint like space map
      const colors = ['#ffffff', '#f8f8ff', '#e6f3ff', '#cce7ff', '#b3d9ff'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      starArray.push({
        position: [x, y, z],
        size,
        color,
        twinkleSpeed: 0.3 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    // Add some nebula dust points for extra atmosphere
    for (let i = 0; i < 30; i++) {
      const radius = 45 + Math.random() * 30;
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = Math.random() * 2 * Math.PI;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      starArray.push({
        position: [x, y, z],
        size: 0.3 + Math.random() * 0.6,
        color: '#3b82f6', // Blue nebula color
        twinkleSpeed: 0.1 + Math.random() * 0.3,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    return starArray;
  }, []);

  return (
    <group>
      {stars.map((star, index) => (
        <StarPoint
          key={index}
          position={star.position}
          size={star.size}
          color={star.color}
          twinkleSpeed={star.twinkleSpeed}
          twinklePhase={star.twinklePhase}
        />
      ))}
    </group>
  );
};

interface StarPointProps {
  position: [number, number, number];
  size: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

const StarPoint: React.FC<StarPointProps> = ({ position, size, color, twinkleSpeed, twinklePhase }) => {
  const meshRef = React.useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const twinkle = 0.4 + 0.4 * (1 + Math.sin(time * twinkleSpeed + twinklePhase)) / 2;
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = twinkle;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 4, 4]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        emissive={color}
        emissiveIntensity={0.3}
        fog={false}
      />
    </mesh>
  );
};
