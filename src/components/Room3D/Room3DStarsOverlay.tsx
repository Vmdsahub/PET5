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
        // Very subtle twinkle like SpaceMap
        const twinkle = 0.7 + 0.3 * Math.sin(currentTime * 0.5 + star.twinklePhase);
        const currentOpacity = star.opacity * twinkle;

        // Very subtle parallax movement
        const parallaxX = Math.sin(currentTime * star.parallaxSpeed + index) * 1;
        const parallaxY = Math.cos(currentTime * star.parallaxSpeed * 0.7 + index) * 0.8;

        const x = star.x + parallaxX;
        const y = star.y + parallaxY;

        // Wrap around screen
        const wrappedX = ((x % canvas.width) + canvas.width) % canvas.width;
        const wrappedY = ((y % canvas.height) + canvas.height) % canvas.height;

        // Draw tiny star - SpaceMap style
        ctx.save();
        ctx.globalAlpha = currentOpacity;

        // Just a tiny dot for most stars
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(wrappedX, wrappedY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Tiny bright center only for slightly larger stars
        if (star.size > 0.8) {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(wrappedX, wrappedY, star.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
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
