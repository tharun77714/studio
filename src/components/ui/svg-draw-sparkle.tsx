"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function SvgDrawSparkle({ className }: { className?: string }) {
  const icon = {
    hidden: {
      opacity: 0,
      pathLength: 0,
      fill: "rgba(212, 175, 55, 0)"
    },
    visible: {
      opacity: 1,
      pathLength: 1,
      fill: "rgba(212, 175, 55, 1)",
      transition: {
        default: { duration: 2, ease: "easeInOut" },
        fill: { duration: 2, ease: [1, 0, 0.8, 1] }
      }
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="w-full h-full stroke-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]"
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
          variants={icon}
          initial="hidden"
          animate="visible"
        />
        <motion.path
          d="M20 3v4"
          variants={icon}
          initial="hidden"
          animate="visible"
        />
        <motion.path
          d="M22 5h-4"
          variants={icon}
          initial="hidden"
          animate="visible"
        />
        <motion.path
          d="M4 17v2"
          variants={icon}
          initial="hidden"
          animate="visible"
        />
        <motion.path
          d="M5 18H3"
          variants={icon}
          initial="hidden"
          animate="visible"
        />
      </motion.svg>
    </div>
  );
}
