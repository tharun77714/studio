"use client";

import React, { useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipCardProps {
  isFlipped: boolean;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  variant: "gold" | "violet";
  className?: string;
}

export function FlipCard({
  isFlipped,
  frontContent,
  backContent,
  variant,
  className,
}: FlipCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Smooth spring physics for mouse parallax
  const mouseX = useSpring(0, { stiffness: 400, damping: 40 });
  const mouseY = useSpring(0, { stiffness: 400, damping: 40 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Normalized coordinates (-1 to 1)
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  // Parallax tilt (subtle, max 6 degrees)
  const rotateX = useTransform(mouseY, [-1, 1], [6, -6]);
  const rotateY = useTransform(mouseX, [-1, 1], [-6, 6]);
  // Dynamic lighting highlight
  const shineX = useTransform(mouseX, [-1, 1], [150, -150]);
  const shineY = useTransform(mouseY, [-1, 1], [150, -150]);
  const shineOpacity = useTransform(mouseX, [-1, 0, 1], [0.15, 0, 0.15]);

  const ACCENT_RGB = variant === "gold" ? "212,175,55" : "139,92,246";
  const ACCENT_LIGHT_RGB = variant === "gold" ? "255,220,100" : "196,181,253";

  // Common diagonal base styles
  const metallicBase = `linear-gradient(145deg, rgba(${ACCENT_RGB}, 0.8) 0%, rgba(${ACCENT_RGB}, 0.4) 50%, rgba(10,10,10,0.9) 100%)`;
  const noiseTexture = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-[440px] z-10", className)}
      style={{ perspective: "2000px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Outer Parallax Container */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-full min-h-[580px] rounded-[32px]"
      >
        {/* Inner Flip Container */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 65, damping: 22, mass: 1.2 }}
          style={{ transformStyle: "preserve-3d" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* ======================= FRONT FACE ======================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08) inset`,
            }}
          >
            {/* Front Background Layer (Metallic Bottom Right) */}
            <div className="absolute inset-0" style={{ background: metallicBase }}>
              <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundImage: noiseTexture }} />
            </div>

            {/* Front Diagonal Split (Matte White Top Left) */}
            <div
              className="absolute inset-0"
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(20px)",
                clipPath: "polygon(0 0, 100% 0, 0 100%)",
              }}
            />

            {/* Content Wrapper */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col">
              {frontContent}
            </div>

            {/* Dynamic Reflective Shine */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-[32px] mix-blend-overlay"
              style={{
                background: `radial-gradient(800px circle at calc(50% + ${shineX}px) calc(50% + ${shineY}px), rgba(255,255,255,1), transparent 40%)`,
                opacity: shineOpacity,
              }}
            />
          </div>

          {/* ======================= BACK FACE ======================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08) inset`,
            }}
          >
            {/* Back Background Layer (Metallic Bottom Right, logically flipped) */}
            <div className="absolute inset-0" style={{ background: metallicBase }}>
              <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundImage: noiseTexture }} />
            </div>

            {/* Back Diagonal Split (Matte White Top Left) */}
            <div
              className="absolute inset-0"
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(20px)",
                clipPath: "polygon(0 0, 100% 0, 0 100%)",
              }}
            />

            {/* Content Wrapper */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col">
              {backContent}
            </div>

            {/* Dynamic Reflective Shine */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-[32px] mix-blend-overlay"
              style={{
                background: `radial-gradient(800px circle at calc(50% + ${shineX}px) calc(50% + ${shineY}px), rgba(255,255,255,1), transparent 40%)`,
                opacity: shineOpacity,
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
