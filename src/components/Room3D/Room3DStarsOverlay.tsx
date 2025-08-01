import React, { useEffect, useRef, useMemo } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  twinklePhase: number;
}

export const Room3DStarsOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Generate bright, visible stars
  const stars = useMemo<Star[]>(() => {
    const starArray: Star[] = [];
    
    // Create 200 visible stars
    for (let i = 0; i < 200; i++) {
      starArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1.5 + Math.random() * 2.5, // 1.5-4px stars - bigger
        opacity: 0.8 + Math.random() * 0.2, // 0.8-1.0 opacity - brighter
        color: Math.random() < 0.7 ? "#ffffff" : "#4FC3F7", // Bright blue contrast
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    return starArray;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('Stars canvas initialized'); // Debug log

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log(`Canvas size: ${canvas.width}x${canvas.height}`); // Debug log
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const animate = () => {
      // Clear canvas with semi-transparent background for testing
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const currentTime = Date.now() * 0.001;

      stars.forEach((star, index) => {
        // Simple twinkle effect
        const twinkle = 0.5 + 0.5 * Math.sin(currentTime + star.twinklePhase);
        const currentOpacity = star.opacity * twinkle;

        // Simple drift
        const driftX = Math.sin(currentTime * 0.1 + index) * 2;
        const driftY = Math.cos(currentTime * 0.08 + index) * 2;

        const x = star.x + driftX;
        const y = star.y + driftY;

        // Draw star with glow
        ctx.save();
        ctx.globalAlpha = currentOpacity;

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 4);
        gradient.addColorStop(0, star.color);
        gradient.addColorStop(0.5, star.color + '80');
        gradient.addColorStop(1, star.color + '00');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, star.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Main star
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, star.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
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
        zIndex: 5, // Above background, below UI
        opacity: 1, // Full opacity
        backgroundColor: 'transparent',
        mixBlendMode: 'screen', // Additive blending for glow
      }}
    />
  );
};
