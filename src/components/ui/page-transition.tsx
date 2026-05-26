"use client";

import { motion } from "framer-motion";
import { ReactNode, forwardRef, CSSProperties } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  enter: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    }
  },
  exit: { 
    opacity: 0, 
    y: -15, 
    scale: 0.98,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

export const PageTransition = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string; style?: CSSProperties }
>(({ children, className, style }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
})

PageTransition.displayName = 'PageTransition';
