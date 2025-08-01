import React, { useEffect, useRef, useMemo, useState } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  twinklePhase: number;
  layer: number; // Identificar a camada para parallax
  baseX: number; // Posição base para parallax
  baseY: number; // Posição base para parallax
}

interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export const Room3DStarsOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [cameraState, setCameraState] = useState<CameraState>({ x: 0, y: 0, zoom: 12 });
  const lastCameraState = useRef<CameraState>({ x: 0, y: 0, zoom: 12 });

  // Generate stars with 5 distinct layers for better parallax
  const stars = useMemo<Star[]>(() => {
    const starArray: Star[] = [];

    // Layer 1: Far deep background (slowest parallax, smallest stars)
    for (let i = 0; i < 250; i++) {
      const x = Math.random() * (window.innerWidth + 400);
      const y = Math.random() * (window.innerHeight + 400);
      starArray.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size: 0.2 + Math.random() * 0.4, // Very tiny: 0.2-0.6px
        opacity: 0.15 + Math.random() * 0.25, // Very subtle: 0.15-0.4
        color: Math.random() < 0.98 ? "#ffffff" : "#b3d9ff",
        twinklePhase: Math.random() * Math.PI * 2,
        layer: 1,
      });
    }

    // Layer 2: Far background
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * (window.innerWidth + 300);
      const y = Math.random() * (window.innerHeight + 300);
      starArray.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size: 0.3 + Math.random() * 0.6, // Small: 0.3-0.9px
        opacity: 0.2 + Math.random() * 0.35, // Subtle: 0.2-0.55
        color: Math.random() < 0.95 ? "#ffffff" : "#b3d9ff",
        twinklePhase: Math.random() * Math.PI * 2,
        layer: 2,
      });
    }

    // Layer 3: Mid background
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * (window.innerWidth + 200);
      const y = Math.random() * (window.innerHeight + 200);
      starArray.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size: 0.5 + Math.random() * 0.8, // Medium: 0.5-1.3px
        opacity: 0.3 + Math.random() * 0.4, // More visible: 0.3-0.7
        color: Math.random() < 0.92 ? "#ffffff" : "#87CEEB",
        twinklePhase: Math.random() * Math.PI * 2,
        layer: 3,
      });
    }

    // Layer 4: Near background
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * (window.innerWidth + 100);
      const y = Math.random() * (window.innerHeight + 100);
      starArray.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size: 0.6 + Math.random() * 1.0, // Larger: 0.6-1.6px
        opacity: 0.4 + Math.random() * 0.4, // Visible: 0.4-0.8
        color: Math.random() < 0.88 ? "#ffffff" : "#6eb5ff",
        twinklePhase: Math.random() * Math.PI * 2,
        layer: 4,
      });
    }

    // Layer 5: Closest background (fastest parallax, largest stars)
    for (let i = 0; i < 75; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      starArray.push({
        x,
        y,
        baseX: x,
        baseY: y,
        size: 0.8 + Math.random() * 1.2, // Largest: 0.8-2.0px
        opacity: 0.5 + Math.random() * 0.4, // Most visible: 0.5-0.9
        color: Math.random() < 0.85 ? "#ffffff" : "#4da6ff",
        twinklePhase: Math.random() * Math.PI * 2,
        layer: 5,
      });
    }

    return starArray;
  }, []);

  // Listen for camera changes from OrbitControls
  useEffect(() => {
    const handleCameraChange = (event: CustomEvent) => {
      const { position, target, zoom, deltaX, deltaY, deltaZ } = event.detail;

      // Atualizar estado da câmera baseado nos dados reais do Three.js
      setCameraState(prev => ({
        x: prev.x + deltaX * 50, // Amplificar movimento para efeito parallax
        y: prev.y + deltaY * 50,
        zoom: zoom,
      }));
    };

    const handleMouseMove = (event: MouseEvent) => {
      // Detectar movimento do mouse APENAS durante rotação com botão direito
      if (event.buttons === 2) { // Apenas botão direito
        const deltaX = event.movementX;
        const deltaY = event.movementY;

        setCameraState(prev => ({
          ...prev,
          x: prev.x + deltaX * 0.3,
          y: prev.y + deltaY * 0.3,
        }));
      }
    };

    // Listener apenas para movimento do mouse
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const currentTime = Date.now() * 0.001;

      // Parallax multipliers for each layer (closer layers move more)
      const parallaxMultipliers = {
        1: 0.005, // Far deep background - almost no movement
        2: 0.015, // Far background
        3: 0.035, // Mid background
        4: 0.065, // Near background
        5: 0.1,   // Closest background - most movement
      };

      // Zoom-based parallax multiplier
      const zoomParallaxFactor = (cameraState.zoom - 12) * 0.002;

      stars.forEach((star, index) => {
        // Subtle twinkle with varying speeds
        const twinkleSpeed = 0.2 + (index % 4) * 0.15;
        const twinkle = 0.7 + 0.3 * Math.sin(currentTime * twinkleSpeed + star.twinklePhase);
        const currentOpacity = star.opacity * twinkle;

        // Calculate parallax offset based on camera movement and layer
        const layerMultiplier = parallaxMultipliers[star.layer as keyof typeof parallaxMultipliers] || 0.02;
        
        // Parallax based on camera position
        const parallaxX = cameraState.x * layerMultiplier;
        const parallaxY = cameraState.y * layerMultiplier;
        
        // Additional zoom-based parallax
        const zoomParallaxX = (cameraState.x * zoomParallaxFactor) * star.layer;
        const zoomParallaxY = (cameraState.y * zoomParallaxFactor) * star.layer;

        // Calculate final position
        const x = star.baseX + parallaxX + zoomParallaxX;
        const y = star.baseY + parallaxY + zoomParallaxY;

        // Wrap around with extended margins for each layer
        const marginX = 200 + (star.layer * 50);
        const marginY = 200 + (star.layer * 50);
        
        const wrappedX = ((x % (canvas.width + marginX * 2)) + (canvas.width + marginX * 2)) % (canvas.width + marginX * 2) - marginX;
        const wrappedY = ((y % (canvas.height + marginY * 2)) + (canvas.height + marginY * 2)) % (canvas.height + marginY * 2) - marginY;

        // Only draw stars that are visible on screen
        if (wrappedX >= -20 && wrappedX <= canvas.width + 20 &&
            wrappedY >= -20 && wrappedY <= canvas.height + 20) {

          // Draw star
          ctx.save();
          ctx.globalAlpha = currentOpacity;

          // Very subtle glow for larger stars only
          if (star.size > 1.2 && currentOpacity > 0.6) {
            const gradient = ctx.createRadialGradient(wrappedX, wrappedY, 0, wrappedX, wrappedY, star.size * 2);
            gradient.addColorStop(0, star.color);
            gradient.addColorStop(0.6, star.color + '30');
            gradient.addColorStop(1, star.color + '00');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(wrappedX, wrappedY, star.size * 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Main star dot
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(wrappedX, wrappedY, star.size, 0, Math.PI * 2);
          ctx.fill();

          // Tiny bright center for larger stars
          if (star.size > 1.0) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(wrappedX, wrappedY, star.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stars, cameraState]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -10, // Deep background - behind everything
        opacity: 0.7, // Slightly more visible for parallax effect
        backgroundColor: 'transparent',
      }}
    />
  );
};
