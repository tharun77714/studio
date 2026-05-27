"use client";

import React, { forwardRef, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  accentColor?: string;        // e.g. "hsl(43 74% 66%)" for gold, "hsl(262 83% 68%)" for violet
  accentRgb?: string;          // e.g. "212,175,55" for gold, "139,92,246" for violet
  rightElement?: React.ReactNode;
}

const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  (
    {
      label,
      error,
      icon,
      accentColor = "hsl(43 74% 66%)",
      accentRgb = "212,175,55",
      rightElement,
      className = "",
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const id = useId();
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      (value as string) ?? (defaultValue as string) ?? ""
    );

    const isFloated = isFocused || (value !== undefined ? String(value).length > 0 : internalValue.length > 0);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    return (
      <div className="relative w-full">
        {/* Input wrapper */}
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-all duration-300"
              style={{ color: isFocused ? accentColor : "rgba(156,163,175,0.7)" }}
            >
              {icon}
            </div>
          )}

          {/* Floating label */}
          <motion.label
            htmlFor={id}
            className="absolute z-10 cursor-text select-none font-sans pointer-events-none"
            initial={false}
            animate={{
              top: isFloated ? "8px" : "50%",
              y: isFloated ? "0%" : "-50%",
              fontSize: isFloated ? "10px" : "14px",
              left: icon ? (isFloated ? "16px" : "44px") : "16px",
              color: isFocused
                ? accentColor
                : isFloated
                ? "rgba(156,163,175,0.9)"
                : "rgba(107,114,128,0.85)",
              letterSpacing: isFloated ? "0.08em" : "0",
            }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {label}
          </motion.label>

          {/* Input */}
          <input
            ref={ref}
            id={id}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              w-full rounded-xl bg-white/[0.04] text-white font-sans
              border transition-all duration-300 outline-none
              ${icon ? "pl-11 pr-4" : "pl-4 pr-4"}
              ${rightElement ? "!pr-12" : ""}
              pt-6 pb-3
              text-[15px] leading-tight
              placeholder-transparent
              ${className}
            `}
            style={{
              borderColor: isFocused
                ? accentColor
                : error
                ? "rgba(239,68,68,0.7)"
                : "rgba(255,255,255,0.08)",
              boxShadow: isFocused
                ? `0 0 0 3px rgba(${accentRgb},0.15), 0 1px 3px rgba(0,0,0,0.3)`
                : error
                ? "0 0 0 3px rgba(239,68,68,0.1)"
                : "0 1px 3px rgba(0,0,0,0.2)",
              background: isFocused
                ? `rgba(${accentRgb},0.04)`
                : "rgba(255,255,255,0.04)",
            }}
            {...rest}
          />

          {/* Right element (e.g. show/hide password) */}
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              {rightElement}
            </div>
          )}

          {/* Animated bottom accent line */}
          <motion.div
            className="absolute bottom-0 left-0 h-[1.5px] rounded-b-xl"
            style={{ background: accentColor }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: isFocused ? 1 : 0,
              opacity: isFocused ? 1 : 0,
            }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mt-1.5 text-xs font-sans text-red-400 pl-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";
export { AnimatedInput };
