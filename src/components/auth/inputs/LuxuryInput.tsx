"use client";

import React, { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LuxuryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const LuxuryInput = forwardRef<HTMLInputElement, LuxuryInputProps>(
  ({ className, label, id, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      if (props.onChange) props.onChange(e);
    };

    const floatLabel = isFocused || hasValue;

    return (
      <div className="relative w-full group">
        {/* Border Glow / Shadow layer */}
        <motion.div
          animate={{
            opacity: isFocused ? 1 : 0,
            boxShadow: isFocused
              ? "0 0 0 1px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.02)"
              : "0 0 0 0px rgba(0,0,0,0)",
          }}
          transition={{ duration: 0.3, ease: [0.25, 1, 0.36, 1] }}
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity"
        />

        <input
          ref={ref}
          id={id}
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          placeholder=""
          className={cn(
            "w-full h-12 px-4 pt-4 pb-1 rounded-2xl bg-white/40 border border-black/5 text-[#0a0700] text-[13px] font-sans outline-none focus:bg-white/60 transition-all duration-300 backdrop-blur-sm",
            className
          )}
        />
        
        {/* Floating Label */}
        <motion.label
          htmlFor={id}
          initial={false}
          animate={{
            y: floatLabel ? -8 : 0,
            scale: floatLabel ? 0.8 : 1,
            color: floatLabel ? "rgba(10, 7, 0, 0.5)" : "rgba(10, 7, 0, 0.4)",
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-4 top-3.5 origin-left pointer-events-none text-[13px] font-sans font-medium"
        >
          {label}
        </motion.label>
      </div>
    );
  }
);
LuxuryInput.displayName = "LuxuryInput";
