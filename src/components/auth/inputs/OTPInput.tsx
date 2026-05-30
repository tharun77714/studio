"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
}

export const OTPInput = ({ length = 6, value, onChange, onComplete }: OTPInputProps) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 1);
    
    const newArr = value.split("");
    newArr[idx] = val;
    const newVal = newArr.join("");
    onChange(newVal);

    if (val && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
    
    if (newVal.length === length && onComplete) {
      onComplete(newVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  return (
    <motion.div 
      variants={{
        show: { transition: { staggerChildren: 0.1 } }
      }}
      initial="hidden"
      animate="show"
      className="flex justify-between gap-2 w-full"
    >
      {Array.from({ length }).map((_, idx) => (
        <motion.div
          key={idx}
          variants={{
            hidden: { y: 20, opacity: 0, scale: 0.9 },
            show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
          }}
        >
          <input
            ref={(el) => { inputsRef.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[idx] || ""}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              "w-10 h-12 md:w-12 md:h-14 rounded-2xl bg-white/40 border text-center text-lg font-headline font-semibold text-[#0a0700] outline-none transition-all duration-300 backdrop-blur-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]",
              value[idx] 
                ? "border-black/20 bg-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                : "border-black/5 focus:border-black/20 focus:bg-white/60 focus:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            )}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
