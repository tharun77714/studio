"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface LuxuryBtnProps extends HTMLMotionProps<"button"> {
  isLoading?: boolean;
  variant?: "solid" | "outline" | "google";
}

export const LuxuryBtn = React.forwardRef<HTMLButtonElement, LuxuryBtnProps>(
  ({ className, children, isLoading, variant = "solid", ...props }, ref) => {
    
    const baseStyle = "relative w-full h-12 rounded-2xl flex items-center justify-center text-[13px] font-sans font-semibold overflow-hidden transition-all duration-500 group";
    
    const variants = {
      solid: "bg-[#0a0700] text-white shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)]",
      outline: "bg-white/20 border border-black/5 text-[#0a0700] hover:bg-white/40",
      google: "bg-white text-[#0a0700] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-black/[0.04] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }} // Physical compression
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(baseStyle, variants[variant], className)}
        {...props}
      >
        {/* Shimmer sweep effect */}
        {variant === "solid" && (
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        )}
        
        {/* Google Light Expansion container (handled externally, but can add base glow here) */}
        
        <span className="relative z-10 flex items-center gap-2">
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            children
          )}
        </span>
      </motion.button>
    );
  }
);
LuxuryBtn.displayName = "LuxuryBtn";
