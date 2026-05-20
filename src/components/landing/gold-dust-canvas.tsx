"use client";

import { useEffect, useRef } from "react";

export function GoldDustCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      maxOpacity: number;
      pulseDirection: number;
    }> = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    const particleCount = 70;
    for (let i = 0; i < particleCount; i++) {
      const maxOpacity = Math.random() * 0.4 + 0.1;
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.6,
        speedX: Math.random() * 0.3 - 0.15,
        speedY: Math.random() * -0.4 - 0.1, // Drifts gently upward
        opacity: Math.random() * maxOpacity,
        maxOpacity,
        pulseDirection: Math.random() > 0.5 ? 1 : -1,
      });
    }

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Subtle glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        ctx.fillStyle = `rgba(212, 175, 55, ${p.opacity})`;
        ctx.shadowBlur = p.size * 3.5;
        ctx.shadowColor = "rgba(212, 175, 55, 0.3)";
        ctx.fill();

        // Position progression
        p.x += p.speedX;
        p.y += p.speedY;

        // Breathe/Pulse opacity for natural flickering
        p.opacity += p.pulseDirection * 0.003;
        if (p.opacity > p.maxOpacity || p.opacity < 0.05) {
          p.pulseDirection *= -1;
        }

        // Loop seamlessly when leaving the viewport bounds
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
          p.opacity = Math.random() * p.maxOpacity;
        }
        if (p.x < 0 || p.x > canvas.width) {
          p.speedX *= -1;
        }
      });

      animationFrameId = requestAnimationFrame(drawParticles);
    };

    drawParticles();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-50 mix-blend-screen"
    />
  );
}
