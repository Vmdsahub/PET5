import React, { useEffect, useRef, useMemo } from 'react';

interface Star {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
  parallaxLayer: number;
  driftSpeed: number;
  driftPhase: number;
}

export const Room3DStarsOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  // Generate very subtle background stars with proper layering
  const stars = useMemo<Star[]>(() => {
    const starArray: Star[] = [];
    
    // Star colors - mostly white with few colored ones
    const generateStarColor = () => {
      const colors = [
        "#ffffff", "#f8f8ff", "#e6f3ff", "#cce7ff", "#b3d9ff",
        "#87CEEB", "#6495ED", "#4169E1"
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Layer 1: Very far background (slowest parallax)
    for (let i = 0; i < 80; i++) {
      starArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        baseX: Math.random() * window.innerWidth,
        baseY: Math.random() * window.innerHeight,
        size: 0.5 + Math.random() * 0.8, // Slightly larger
        opacity: 0.4 + Math.random() * 0.4, // More visible
        color: Math.random() < 0.95 ? "#ffffff" : generateStarColor(),
        twinkleSpeed: 0.1 + Math.random() * 0.3,
        twinklePhase: Math.random() * Math.PI * 2,
        parallaxLayer: 0.02, // Very slow movement
        driftSpeed: 0.05 + Math.random() * 0.1,
        driftPhase: Math.random() * Math.PI * 2,
      });
    }

    // Layer 2: Mid background
    for (let i = 0; i < 60; i++) {
      starArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        baseX: Math.random() * window.innerWidth,
        baseY: Math.random() * window.innerHeight,
        size: 0.6 + Math.random() * 0.9,
        opacity: 0.5 + Math.random() * 0.4,
        color: Math.random() < 0.93 ? "#ffffff" : generateStarColor(),
        twinkleSpeed: 0.2 + Math.random() * 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        parallaxLayer: 0.05,
        driftSpeed: 0.1 + Math.random() * 0.15,
        driftPhase: Math.random() * Math.PI * 2,
      });
    }

    // Layer 3: Closer background (faster parallax)
    for (let i = 0; i < 40; i++) {
      starArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        baseX: Math.random() * window.innerWidth,
        baseY: Math.random() * window.innerHeight,
        size: 0.7 + Math.random() * 1.1,
        opacity: 0.6 + Math.random() * 0.4,
        color: Math.random() < 0.90 ? "#ffffff" : generateStarColor(),
        twinkleSpeed: 0.3 + Math.random() * 0.7,
        twinklePhase: Math.random() * Math.PI * 2,
        parallaxLayer: 0.08,
        driftSpeed: 0.15 + Math.random() * 0.2,
        driftPhase: Math.random() * Math.PI * 2,
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
      
      const currentTime = (Date.now() - startTimeRef.current) * 0.001;

      stars.forEach(star => {
        // Very subtle twinkle
        const twinkle = 0.5 + 0.5 * (1 + Math.sin(currentTime * star.twinkleSpeed + star.twinklePhase)) / 2;
        const currentOpacity = star.opacity * twinkle;

        // Gentle drift motion
        const driftX = Math.sin(currentTime * star.driftSpeed + star.driftPhase) * star.parallaxLayer * 10;
        const driftY = Math.cos(currentTime * star.driftSpeed * 0.7 + star.driftPhase) * star.parallaxLayer * 8;

        // Very subtle parallax based on time for background feel
        const parallaxX = Math.sin(currentTime * 0.05) * star.parallaxLayer * 15;
        const parallaxY = Math.cos(currentTime * 0.03) * star.parallaxLayer * 10;

        const x = star.baseX + driftX + parallaxX;
        const y = star.baseY + driftY + parallaxY;

        // Wrap around screen edges
        const wrappedX = ((x % canvas.width) + canvas.width) % canvas.width;
        const wrappedY = ((y % canvas.height) + canvas.height) % canvas.height;

        // Draw very subtle star
        ctx.save();
        ctx.globalAlpha = currentOpacity;

        // Soft glow for larger stars
        if (star.size > 0.6) {
          const gradient = ctx.createRadialGradient(wrappedX, wrappedY, 0, wrappedX, wrappedY, star.size * 2);
          gradient.addColorStop(0, star.color);
          gradient.addColorStop(0.5, star.color + '40'); // Very transparent
          gradient.addColorStop(1, star.color + '00'); // Fully transparent

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(wrappedX, wrappedY, star.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Main star dot - very small
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(wrappedX, wrappedY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Tiny bright center for larger stars
        if (star.size > 0.5) {
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
        zIndex: -1, // Behind everything, true background
        opacity: 0.4, // Very subtle
      }}
    />
  );
};
