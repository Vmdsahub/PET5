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
    const starCount = 200;

    for (let i = 0; i < starCount; i++) {
      // Create stars in a large sphere around the room
      const phi = Math.acos(-1 + (2 * i) / starCount);
      const theta = Math.sqrt(starCount * Math.PI) * phi;
      
      const radius = 30 + Math.random() * 50; // Far from room
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      const size = 0.1 + Math.random() * 0.3;
      const colors = ['#ffffff', '#f0f8ff', '#87ceeb', '#b0c4de', '#e6e6fa'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      starArray.push({
        position: [x, y, z],
        size,
        color,
        twinkleSpeed: 0.5 + Math.random() * 2,
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
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const twinkle = 0.3 + 0.7 * (1 + Math.sin(time * twinkleSpeed + twinklePhase)) / 2;
      meshRef.current.material.opacity = twinkle;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 6, 6]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={1}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};
