"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipCardProps {
  isFlipped: boolean;       // false = Front (SignIn), true = Back (SignUp)
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  variant: "gold" | "violet";
  frontMode?: "email" | "phone" | "google";
  backMode?: "email" | "phone" | "google";
  isSuccess?: boolean;      // Triggers Vault Entry animation
  className?: string;
}

export function FlipCard({
  isFlipped,
  frontContent,
  backContent,
  variant,
  frontMode = "email",
  backMode = "email",
  isSuccess = false,
  className,
}: FlipCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);

  // Mark that a flip has occurred at least once to trigger scale keyframes correctly
  useEffect(() => {
    if (isFlipped) setHasFlipped(true);
  }, [isFlipped]);

  // Spring physics for mouse parallax (cinematic cursor tracking)
  const mouseX = useSpring(0, { stiffness: 300, damping: 50, mass: 1 });
  const mouseY = useSpring(0, { stiffness: 300, damping: 50, mass: 1 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || isSuccess) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2); // -1 to 1
    const y = (e.clientY - centerY) / (rect.height / 2); // -1 to 1
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  // Parallax tilt (subtle, max 4 degrees for heavy feel)
  const rotateX = useTransform(mouseY, [-1, 1], [4, -4]);
  const rotateY_parallax = useTransform(mouseX, [-1, 1], [-4, 4]);

  // Dynamic lighting highlights (Reflection Layer)
  const shineX = useTransform(mouseX, [-1, 1], [200, -200]);
  const shineY = useTransform(mouseY, [-1, 1], [200, -200]);
  const shineOpacity = useTransform(mouseX, [-1, 0, 1], [0.25, 0, 0.25]);

  const ACCENT_RGB = variant === "gold" ? "212,175,55" : "139,92,246";

  // Heavy, physical motion springs
  const flipTransition = {
    rotateY: { type: "spring", stiffness: 40, damping: 14, mass: 2.2, restDelta: 0.001 },
    scale: { type: "spring", stiffness: 60, damping: 18, mass: 1.5 },
  };

  // Success vault entry animation
  const vaultTransition = { duration: 1.2, ease: [0.25, 1, 0.36, 1] };

  // Determine current diagonal paths
  const frontClipPath = frontMode === "phone" ? "polygon(0 0, 100% 0, 0 75%)" : "polygon(0 0, 100% 0, 0 100%)";
  const backClipPath = backMode === "phone" ? "polygon(0 0, 100% 0, 0 75%)" : "polygon(0 0, 100% 0, 0 100%)";

  return (
    <motion.div
      ref={containerRef}
      initial={false}
      animate={isSuccess ? { scale: 0.9, opacity: 0, filter: "blur(20px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
      transition={vaultTransition}
      className={cn("relative w-full max-w-[460px] z-10", className)}
      style={{ perspective: "2000px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Google Mode Expansion Bloom */}
      <AnimatePresence>
        {(frontMode === "google" || backMode === "google") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 1.5, ease: [0.25, 1, 0.36, 1] }}
            className="absolute inset-0 bg-white rounded-[32px] z-50 pointer-events-none mix-blend-overlay blur-3xl"
          />
        )}
      </AnimatePresence>

      {/* Layer 1: Responsive Shadow Layer */}
      <motion.div
        animate={{ 
          scale: isSuccess ? 0.9 : hasFlipped ? [1, 0.92, 1] : 1,
          boxShadow: hasFlipped 
            ? ["0 40px 100px rgba(0,0,0,0.5)", "0 10px 30px rgba(0,0,0,0.8)", "0 40px 100px rgba(0,0,0,0.5)"] 
            : "0 40px 100px rgba(0,0,0,0.5)"
        }}
        transition={flipTransition}
        className="absolute inset-0 rounded-[32px]"
      />

      {/* Outer Parallax Container (Tilt) */}
      <motion.div
        style={{ rotateX, rotateY: rotateY_parallax, transformStyle: "preserve-3d" }}
        className="relative w-full min-h-[640px] rounded-[32px]"
      >
        {/* Inner Flip Container (Flip Physics) */}
        <motion.div
          animate={{ 
            rotateY: isFlipped ? 180 : 0,
            scale: hasFlipped ? [1, 0.94, 1] : 1, // Physical lift effect
            z: hasFlipped ? [0, -50, 0] : 0,      // Physical depth drop
          }}
          transition={flipTransition}
          style={{ transformStyle: "preserve-3d" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* ======================= FRONT FACE (SignIn: Matte White Dominant) ======================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden border border-white/[0.08]"
            style={{
              backfaceVisibility: "hidden",
              pointerEvents: isFlipped ? "none" : "auto",
              background: `linear-gradient(145deg, rgba(${ACCENT_RGB}, 0.9) 0%, rgba(${ACCENT_RGB}, 0.5) 50%, rgba(10,10,10,0.9) 100%)`, // Metallic Base
            }}
          >
            {/* Cinematic Noise over metallic base */}
            <div className="absolute inset-0 mix-blend-overlay opacity-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} />

            {/* Layer 3: Matte White Diagonal */}
            <motion.div
              animate={{ clipPath: frontClipPath }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.36, 1] }}
              className="absolute inset-0"
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(20px)",
              }}
            />

            {/* Layer 4: Content */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col">
              {frontContent}
            </div>

            {/* Layer 5: Cursor Reflection (Brushed Metal) */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-[32px] mix-blend-overlay"
              style={{
                background: `radial-gradient(1000px circle at calc(50% + ${shineX}px) calc(50% + ${shineY}px), rgba(255,255,255,0.8), transparent 30%)`,
                opacity: shineOpacity,
              }}
            />

            {/* Layer 6: Static Edge Shimmer */}
            <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
          </div>

          {/* ======================= BACK FACE (SignUp: Metallic Gold Dominant) ======================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-[32px] overflow-hidden border border-white/[0.08]"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              pointerEvents: isFlipped ? "auto" : "none",
              background: "rgba(255,255,255,0.92)", // Matte White Base
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Layer 3: Metallic Gold Diagonal */}
            <motion.div
              animate={{ clipPath: backClipPath }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.36, 1] }}
              className="absolute inset-0"
              style={{
                background: `linear-gradient(145deg, rgba(${ACCENT_RGB}, 0.9) 0%, rgba(${ACCENT_RGB}, 0.5) 50%, rgba(10,10,10,0.9) 100%)`,
              }}
            />
            {/* Cinematic Noise over metallic diagonal */}
            <motion.div 
              animate={{ clipPath: backClipPath }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.36, 1] }}
              className="absolute inset-0 mix-blend-overlay opacity-50" 
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")` }} 
            />

            {/* Layer 4: Content */}
            <div className="relative z-10 w-full h-full p-8 flex flex-col">
              {backContent}
            </div>

            {/* Layer 5: Cursor Reflection (Brushed Metal) */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-[32px] mix-blend-overlay"
              style={{
                background: `radial-gradient(1000px circle at calc(50% + ${shineX}px) calc(50% + ${shineY}px), rgba(255,255,255,0.8), transparent 30%)`,
                opacity: shineOpacity,
              }}
            />

            {/* Layer 6: Static Edge Shimmer */}
            <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
