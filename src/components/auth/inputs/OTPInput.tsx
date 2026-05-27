"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  accentColor?: string;
  accentRgb?: string;
  error?: string;
  onComplete?: (value: string) => void;
}

type OTPState = "idle" | "success" | "error";

export function OTPInput({
  length = 6,
  value,
  onChange,
  accentColor = "hsl(43 74% 66%)",
  accentRgb = "212,175,55",
  error,
  onComplete,
}: OTPInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const [otpState, setOtpState] = useState<OTPState>("idle");

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  // Trigger success animation when all filled
  useEffect(() => {
    if (value.length === length && /^\d+$/.test(value)) {
      setOtpState("success");
      onComplete?.(value);
    } else {
      setOtpState("idle");
    }
  }, [value, length, onComplete]);

  // Trigger error animation on error prop
  useEffect(() => {
    if (error) {
      setOtpState("error");
      const timer = setTimeout(() => setOtpState("idle"), 600);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const updateDigit = useCallback(
    (index: number, digit: string) => {
      const arr = Array.from({ length }, (_, i) => value[i] ?? "");
      arr[index] = digit;
      onChange(arr.join(""));
    },
    [value, length, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (digits[index]) {
          updateDigit(index, "");
        } else if (index > 0) {
          updateDigit(index - 1, "");
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, updateDigit, length]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const raw = e.target.value.replace(/\D/g, "");
      if (!raw) return;

      if (raw.length > 1) {
        // Handle paste scenario
        const sliced = raw.slice(0, length - index);
        const arr = Array.from({ length }, (_, i) => value[i] ?? "");
        sliced.split("").forEach((ch, j) => {
          if (index + j < length) arr[index + j] = ch;
        });
        onChange(arr.join(""));
        const nextFocus = Math.min(index + sliced.length, length - 1);
        inputRefs.current[nextFocus]?.focus();
      } else {
        updateDigit(index, raw);
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    },
    [value, length, onChange, updateDigit]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent, index: number) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
      if (!pasted) return;
      const arr = Array.from({ length }, (_, i) => value[i] ?? "");
      pasted.split("").forEach((ch, j) => {
        if (index + j < length) arr[index + j] = ch;
      });
      onChange(arr.join(""));
      const nextFocus = Math.min(index + pasted.length, length - 1);
      setTimeout(() => inputRefs.current[nextFocus]?.focus(), 10);
    },
    [value, length, onChange]
  );

  const getBoxState = (i: number) => {
    if (otpState === "error") return "error";
    if (otpState === "success") return "success";
    if (focused === i) return "focused";
    if (digits[i]) return "filled";
    return "idle";
  };

  const getBorderColor = (state: ReturnType<typeof getBoxState>) => {
    switch (state) {
      case "focused": return accentColor;
      case "filled": return `rgba(${accentRgb},0.5)`;
      case "success": return "rgba(34,197,94,0.8)";
      case "error": return "rgba(239,68,68,0.8)";
      default: return "rgba(255,255,255,0.1)";
    }
  };

  const getBoxShadow = (state: ReturnType<typeof getBoxState>) => {
    switch (state) {
      case "focused": return `0 0 0 3px rgba(${accentRgb},0.2), 0 2px 8px rgba(0,0,0,0.3)`;
      case "success": return "0 0 0 3px rgba(34,197,94,0.15)";
      case "error": return "0 0 0 3px rgba(239,68,68,0.15)";
      default: return "0 1px 4px rgba(0,0,0,0.2)";
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2.5 justify-center">
        {digits.map((digit, i) => {
          const state = getBoxState(i);
          return (
            <motion.div
              key={i}
              className="relative flex-1"
              animate={
                otpState === "error"
                  ? { x: [-4, 4, -4, 4, 0], transition: { duration: 0.35 } }
                  : {}
              }
            >
              <motion.input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleInput(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={(e) => handlePaste(e, i)}
                onFocus={() => setFocused(i)}
                onBlur={() => setFocused(null)}
                className="
                  w-full h-14 rounded-xl text-center text-2xl font-headline font-bold
                  text-white bg-white/[0.04] outline-none
                  transition-colors duration-200
                  caret-transparent
                "
                style={{
                  border: `1.5px solid ${getBorderColor(state)}`,
                  boxShadow: getBoxShadow(state),
                  background:
                    otpState === "success"
                      ? "rgba(34,197,94,0.06)"
                      : state === "focused"
                      ? `rgba(${accentRgb},0.06)`
                      : "rgba(255,255,255,0.04)",
                  letterSpacing: "0.05em",
                }}
                animate={{
                  scale: state === "focused" ? 1.04 : 1,
                  y: otpState === "success" ? [0, -3, 0] : 0,
                }}
                transition={
                  otpState === "success"
                    ? { delay: i * 0.04, duration: 0.35 }
                    : { duration: 0.15 }
                }
              />

              {/* Pulse dot when filled */}
              <AnimatePresence>
                {digit && state !== "focused" && otpState !== "success" && (
                  <motion.div
                    key="dot"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: accentColor }}
                  />
                )}
              </AnimatePresence>

              {/* Success checkmark overlay */}
              <AnimatePresence>
                {otpState === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.04 } }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center rounded-xl"
                    style={{ background: "rgba(34,197,94,0.08)" }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2 text-center text-xs text-red-400 font-sans"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
