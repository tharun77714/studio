"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CursorGlow() {
  const [mounted, setMounted] = useState(false);

  // Raw coordinate motion values
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Spring physics for highly-tuned trailing glide feel
  const springConfig = { damping: 50, stiffness: 200, mass: 0.9 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      // Offset by half of glow spotlight size (175px) to center perfectly
      mouseX.set(e.clientX - 175);
      mouseY.set(e.clientY - 175);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <motion.div
      style={{
        x: glowX,
        y: glowY,
      }}
      className="fixed top-0 left-0 w-[350px] h-[350px] rounded-full pointer-events-none z-[9998] mix-blend-screen opacity-35 blur-[100px] bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,rgba(0,0,0,0)_65%)] hidden md:block"
    />
  );
}
