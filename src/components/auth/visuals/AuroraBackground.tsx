"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface OrbConfig {
  id: number;
  size: number;
  x: string;
  y: string;
  duration: number;
  delay: number;
  color: string;
  opacity: number;
  xRange: number[];
  yRange: number[];
  scaleRange: number[];
}

interface AuroraBackgroundProps {
  variant: "gold" | "violet";
  isSuccess?: boolean;
  className?: string;
}

const GOLD_COLORS = [
  "radial-gradient(circle, rgba(212,175,55,0.55) 0%, rgba(180,130,20,0.25) 50%, transparent 80%)",
  "radial-gradient(circle, rgba(255,220,100,0.4) 0%, rgba(212,175,55,0.2) 50%, transparent 80%)",
  "radial-gradient(circle, rgba(251,191,36,0.45) 0%, rgba(212,175,55,0.15) 60%, transparent 85%)",
  "radial-gradient(circle, rgba(245,158,11,0.35) 0%, rgba(180,120,20,0.18) 55%, transparent 80%)",
  "radial-gradient(circle, rgba(255,237,160,0.3) 0%, rgba(212,175,55,0.12) 60%, transparent 85%)",
];

const VIOLET_COLORS = [
  "radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(109,40,217,0.25) 50%, transparent 80%)",
  "radial-gradient(circle, rgba(167,139,250,0.4) 0%, rgba(124,58,237,0.2) 50%, transparent 80%)",
  "radial-gradient(circle, rgba(196,181,253,0.35) 0%, rgba(139,92,246,0.15) 60%, transparent 85%)",
  "radial-gradient(circle, rgba(217,70,239,0.35) 0%, rgba(139,92,246,0.18) 55%, transparent 80%)",
  "radial-gradient(circle, rgba(232,121,249,0.28) 0%, rgba(167,139,250,0.12) 60%, transparent 85%)",
];

export function AuroraBackground({ variant, isSuccess = false, className = "" }: AuroraBackgroundProps) {
  const colors = variant === "gold" ? GOLD_COLORS : VIOLET_COLORS;

  const orbs: OrbConfig[] = useMemo(() => [
    {
      id: 0,
      size: 520,
      x: "10%",
      y: "15%",
      duration: 18,
      delay: 0,
      color: colors[0],
      opacity: 1,
      xRange: [-30, 20, -10, 30, -30],
      yRange: [-20, 30, -15, 10, -20],
      scaleRange: [1, 1.08, 0.96, 1.04, 1],
    },
    {
      id: 1,
      size: 420,
      x: "60%",
      y: "60%",
      duration: 22,
      delay: 4,
      color: colors[1],
      opacity: 1,
      xRange: [20, -30, 15, -20, 20],
      yRange: [30, -20, 20, -30, 30],
      scaleRange: [1, 0.94, 1.06, 0.98, 1],
    },
    {
      id: 2,
      size: 360,
      x: "75%",
      y: "20%",
      duration: 25,
      delay: 8,
      color: colors[2],
      opacity: 1,
      xRange: [-20, 25, -15, 20, -20],
      yRange: [15, -25, 20, -10, 15],
      scaleRange: [0.98, 1.06, 0.94, 1.02, 0.98],
    },
    {
      id: 3,
      size: 300,
      x: "30%",
      y: "70%",
      duration: 20,
      delay: 2,
      color: colors[3],
      opacity: 1,
      xRange: [15, -20, 10, -15, 15],
      yRange: [-25, 15, -20, 25, -25],
      scaleRange: [1.02, 0.96, 1.05, 0.98, 1.02],
    },
    {
      id: 4,
      size: 250,
      x: "50%",
      y: "35%",
      duration: 28,
      delay: 12,
      color: colors[4],
      opacity: 1,
      xRange: [-10, 20, -15, 10, -10],
      yRange: [20, -10, 15, -20, 20],
      scaleRange: [1, 1.04, 0.97, 1.03, 1],
    },
  ], [colors]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Deep dark base */}
      <div className="absolute inset-0 bg-[#030303]" />

      {/* Cinematic vignette with subtle breathing */}
      <motion.div
        className="absolute inset-0 z-10"
        animate={{ 
          opacity: isSuccess ? 0.8 : [0.65, 0.75, 0.65],
          backdropFilter: isSuccess ? "blur(30px)" : "blur(0px)" 
        }}
        transition={{ duration: isSuccess ? 1 : 12, repeat: isSuccess ? 0 : Infinity, ease: "easeInOut" }}
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 z-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.028,
          mixBlendMode: "overlay",
        }}
      />

      {/* Aurora orbs */}
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
            transform: "translate(-50%, -50%)",
            filter: "blur(60px)",
            willChange: "transform",
          }}
          animate={{
            x: orb.xRange,
            y: orb.yRange,
            scale: orb.scaleRange,
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
        />
      ))}

      {/* Depth gradient overlay */}
      <div
        className="absolute inset-0 z-5"
        style={{
          background:
            variant === "gold"
              ? "linear-gradient(135deg, rgba(212,175,55,0.04) 0%, transparent 50%, rgba(180,120,0,0.06) 100%)"
              : "linear-gradient(135deg, rgba(139,92,246,0.04) 0%, transparent 50%, rgba(109,40,217,0.06) 100%)",
        }}
      />
    </div>
  );
}
