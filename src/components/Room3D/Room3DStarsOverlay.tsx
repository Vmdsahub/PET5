import React, { useEffect, useRef, useMemo } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
  parallax: number;
}

export const Room3DStarsOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  // Generate stars like in SpaceMap
  const stars = useMemo<Star[]>(() => {
    const starArray: Star[] = [];
    
    // Generate random star colors like in SpaceMap
    const generateRandomStarColor = () => {
      const colors = [
        "#87CEEB", "#87CEFA", "#4169E1", "#6495ED", "#00BFFF", "#1E90FF",
        "#90EE90", "#98FB98", "#00FF7F", "#32CD32", "#00FA9A",
        "#DA70D6", "#BA55D3", "#9370DB", "#8A2BE2", "#DDA0DD",
        "#FF69B4", "#FFB6C1", "#FF1493", "#FFA500", "#FF8C00"
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Create layered stars with different parallax like SpaceMap
    // Layer 1: Deep background - more visible
    for (let i = 0; i < 200; i++) {
      starArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1.0 + Math.random() * 1.5,
        opacity: 0.6 + Math.random() * 0.4,
        color: Math.random() < 0.85 ? "#ffffff" : generateRandomStarColor(),
        twinkleSpeed: 0.5 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
        parallax: 0.1, // Very subtle movement
      });
    }

    // Layer 2: Mid background - brighter
    for (let i = 0; i < 120; i++) {
      starArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1.2 + Math.random() * 1.8,
        opacity: 0.7 + Math.random() * 0.3,
        color: Math.random() < 0.85 ? "#ffffff" : generateRandomStarColor(),
        twinkleSpeed: 0.3 + Math.random() * 1.2,
        twinklePhase: Math.random() * Math.PI * 2,
        parallax: 0.2,
      });
    }

    // Layer 3: Foreground - most visible
    for (let i = 0; i < 80; i++) {
      starArray.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1.5 + Math.random() * 2.0,
        opacity: 0.8 + Math.random() * 0.2,
        color: Math.random() < 0.85 ? "#ffffff" : generateRandomStarColor(),
        twinkleSpeed: 0.2 + Math.random() * 1.0,
        twinklePhase: Math.random() * Math.PI * 2,
        parallax: 0.3,
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
      
      const currentTime = (Date.now() - startTimeRef.current) * 0.001; // Convert to seconds

      stars.forEach(star => {
        // Calculate twinkle effect
        const twinkle = 0.3 + 0.7 * (1 + Math.sin(currentTime * star.twinkleSpeed + star.twinklePhase)) / 2;
        const currentOpacity = star.opacity * twinkle;

        // Subtle parallax movement
        const offsetX = Math.sin(currentTime * 0.1) * star.parallax * 2;
        const offsetY = Math.cos(currentTime * 0.15) * star.parallax * 1.5;

        const x = star.x + offsetX;
        const y = star.y + offsetY;

        // Draw star like in SpaceMap
        ctx.save();
        ctx.globalAlpha = currentOpacity;

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, star.size * 3);
        gradient.addColorStop(0, star.color);
        gradient.addColorStop(0.4, star.color + '80'); // Semi-transparent
        gradient.addColorStop(1, star.color + '00'); // Fully transparent

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, star.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Main star body
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, star.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

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
        zIndex: 2, // Above canvas but below UI
        opacity: 0.9, // Very visible
      }}
    />
  );
};
