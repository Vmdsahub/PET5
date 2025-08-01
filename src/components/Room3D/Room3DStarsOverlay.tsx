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
    
    // Create many tiny stars like SpaceMap
    for (let i = 0; i < 300; i++) {
      starArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 0.5 + Math.random() * 1, // Very small: 0.5-1.5px like SpaceMap
        opacity: 0.3 + Math.random() * 0.5, // Subtle: 0.3-0.8
        color: Math.random() < 0.9 ? "#ffffff" : "#87CEEB", // Mostly white
        twinklePhase: Math.random() * Math.PI * 2,
        parallaxSpeed: 0.02 + Math.random() * 0.03, // Very slow parallax
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
