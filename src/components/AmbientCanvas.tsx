import React, { useEffect, useRef } from 'react';

interface AmbientCanvasProps {
  sceneType?: 'stars' | 'aurora' | 'rain' | 'forest' | 'particles';
  reducedMotion?: boolean;
}

export const AmbientCanvas: React.FC<AmbientCanvasProps> = ({ sceneType = 'aurora', reducedMotion = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (reducedMotion || !sceneType) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool
    const count = sceneType === 'stars' ? 120 : sceneType === 'rain' ? 80 : 45;
    const items = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: sceneType === 'stars' ? Math.random() * 2 + 0.5 : Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: sceneType === 'rain' ? Math.random() * 4 + 4 : (Math.random() - 0.5) * 0.5,
      alpha: Math.random() * 0.7 + 0.2,
      pulse: Math.random() * 0.02 + 0.005,
    }));

    let t = 0;

    const render = () => {
      t += 0.01;
      ctx.clearRect(0, 0, width, height);

      if (sceneType === 'aurora') {
        // Subtle moving gradient orbs
        const grad1 = ctx.createRadialGradient(
          width * 0.3 + Math.sin(t * 0.5) * 120,
          height * 0.4 + Math.cos(t * 0.3) * 80,
          10,
          width * 0.3,
          height * 0.4,
          width * 0.45
        );
        grad1.addColorStop(0, 'rgba(124, 58, 237, 0.18)');
        grad1.addColorStop(1, 'rgba(124, 58, 237, 0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, width, height);

        const grad2 = ctx.createRadialGradient(
          width * 0.7 + Math.cos(t * 0.4) * 100,
          height * 0.6 + Math.sin(t * 0.6) * 90,
          10,
          width * 0.7,
          height * 0.6,
          width * 0.5
        );
        grad2.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
        grad2.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw particle layer
      for (const p of items) {
        p.x += p.speedX;
        p.y += p.speedY;

        if (sceneType === 'rain') {
          if (p.y > height) {
            p.y = 0;
            p.x = Math.random() * width;
          }
          ctx.strokeStyle = `rgba(180, 210, 255, ${p.alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1, p.y + p.size * 5);
          ctx.stroke();
        } else {
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          p.alpha += Math.sin(t * 5 + p.x) * p.pulse;
          p.alpha = Math.max(0.1, Math.min(0.85, p.alpha));

          ctx.fillStyle = sceneType === 'stars' 
            ? `rgba(255, 255, 255, ${p.alpha})`
            : `rgba(167, 139, 250, ${p.alpha * 0.6})`;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [sceneType, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-80"
      aria-hidden="true"
    />
  );
};
