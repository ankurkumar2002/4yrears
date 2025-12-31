
import React, { useEffect, useRef } from 'react';

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#FF69B4', '#FFD700', '#FFB6C1', '#FFFFFF'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 4 + 2,
        d: Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() > 0.5 ? 'heart' : 'circle',
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1
      });
    }

    const drawHeart = (x: number, y: number, size: number, color: string, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(0, -size/2, -size, -size/2, -size, 0);
      ctx.bezierCurveTo(-size, size/2, 0, size, 0, size * 1.5);
      ctx.bezierCurveTo(0, size, size, size/2, size, 0);
      ctx.bezierCurveTo(size, -size/2, 0, -size/2, 0, 0);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.y += (Math.cos(p.d) + 2 + p.r / 2) / 1.5;
        p.x += Math.sin(p.d) * 1;
        p.rotation += p.rotationSpeed;

        if (p.type === 'heart') {
          drawHeart(p.x, p.y, p.r, p.color, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }

        if (p.y > canvas.height) {
          particles[i].y = -20;
          particles[i].x = Math.random() * canvas.width;
        }
      });
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [active]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-1000"
      style={{ opacity: active ? 1 : 0 }}
    />
  );
};

export default Confetti;
