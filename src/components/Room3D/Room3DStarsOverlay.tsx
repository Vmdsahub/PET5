import React, { useEffect, useRef, useMemo } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  twinklePhase: number;
  parallaxSpeed: number;
}

export const Room3DStarsOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Generate tiny stars like SpaceMap - only background
  const stars = useMemo<Star[]>(() => {
    const starArray: Star[] = [];

    // Create more stars to better fill the space - 3 distinct layers

    // Layer 1: Far background (slowest, smallest, most subtle)
    for (let i = 0; i < 200; i++) {
      starArray.push({
        x: Math.random() * (window.innerWidth + 200), // Extend beyond edges
        y: Math.random() * (window.innerHeight + 200),
        size: 0.3 + Math.random() * 0.6, // Very tiny: 0.3-0.9px
        opacity: 0.2 + Math.random() * 0.4, // Very subtle: 0.2-0.6
        color: Math.random() < 0.95 ? "#ffffff" : "#b3d9ff", // Almost all white
        twinklePhase: Math.random() * Math.PI * 2,
        parallaxSpeed: 0.005 + Math.random() * 0.015, // Ultra slow
      });
    }

    // Layer 2: Mid background (medium speed and size)
    for (let i = 0; i < 150; i++) {
      starArray.push({
        x: Math.random() * (window.innerWidth + 100),
        y: Math.random() * (window.innerHeight + 100),
        size: 0.5 + Math.random() * 0.8, // Small: 0.5-1.3px
        opacity: 0.3 + Math.random() * 0.5, // Subtle: 0.3-0.8
        color: Math.random() < 0.92 ? "#ffffff" : "#87CEEB", // Mostly white
        twinklePhase: Math.random() * Math.PI * 2,
        parallaxSpeed: 0.015 + Math.random() * 0.025, // Slow
      });
    }

    // Layer 3: Near background (fastest, slightly larger)
    for (let i = 0; i < 100; i++) {
      starArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 0.6 + Math.random() * 1.2, // Slightly larger: 0.6-1.8px
        opacity: 0.4 + Math.random() * 0.5, // More visible: 0.4-0.9
        color: Math.random() < 0.88 ? "#ffffff" : "#6eb5ff", // Some blue
        twinklePhase: Math.random() * Math.PI * 2,
        parallaxSpeed: 0.025 + Math.random() * 0.035, // Faster
      });
    }

    return starArray;
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

      stars.forEach((star, index) => {
        // Subtle twinkle with varying speeds
        const twinkleSpeed = 0.3 + (index % 3) * 0.2; // Vary twinkle speed per star
        const twinkle = 0.6 + 0.4 * Math.sin(currentTime * twinkleSpeed + star.twinklePhase);
        const currentOpacity = star.opacity * twinkle;

        // Multi-layered movement for depth
        // Primary drift - different directions for each layer
        const primaryDriftX = Math.sin(currentTime * star.parallaxSpeed + index * 0.1) * 2;
        const primaryDriftY = Math.cos(currentTime * star.parallaxSpeed * 0.8 + index * 0.15) * 1.5;

        // Secondary micro-movement for liveliness
        const microDriftX = Math.sin(currentTime * (star.parallaxSpeed * 3) + index * 0.5) * 0.5;
        const microDriftY = Math.cos(currentTime * (star.parallaxSpeed * 2.5) + index * 0.7) * 0.4;

        // Slow global flow - like stellar wind
        const globalFlowX = Math.sin(currentTime * 0.008) * 0.8;
        const globalFlowY = Math.cos(currentTime * 0.006) * 0.6;

        const x = star.x + primaryDriftX + microDriftX + globalFlowX;
        const y = star.y + primaryDriftY + microDriftY + globalFlowY;

        // Extended wrap around for stars that go beyond edges
        const wrappedX = ((x % (canvas.width + 400)) + (canvas.width + 400)) % (canvas.width + 400) - 200;
        const wrappedY = ((y % (canvas.height + 400)) + (canvas.height + 400)) % (canvas.height + 400) - 200;

        // Only draw stars that are visible on screen (with small margin)
        if (wrappedX >= -10 && wrappedX <= canvas.width + 10 &&
            wrappedY >= -10 && wrappedY <= canvas.height + 10) {

          // Draw tiny star - SpaceMap style
          ctx.save();
          ctx.globalAlpha = currentOpacity;

          // Very subtle glow for the brightest stars only
          if (star.size > 1.0 && currentOpacity > 0.6) {
            const gradient = ctx.createRadialGradient(wrappedX, wrappedY, 0, wrappedX, wrappedY, star.size * 1.5);
            gradient.addColorStop(0, star.color);
            gradient.addColorStop(0.7, star.color + '40');
            gradient.addColorStop(1, star.color + '00');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(wrappedX, wrappedY, star.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Main star dot
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(wrappedX, wrappedY, star.size, 0, Math.PI * 2);
          ctx.fill();

          // Tiny bright center for larger stars
          if (star.size > 0.9) {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(wrappedX, wrappedY, star.size * 0.25, 0, Math.PI * 2);
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
  }, [stars]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: -10, // Deep background - behind everything
        opacity: 0.6, // Subtle
        backgroundColor: 'transparent',
        // NO mix-blend-mode to avoid overlaying the room
      }}
    />
  );
};
