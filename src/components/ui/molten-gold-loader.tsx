"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function MoltenGoldLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fade out preloader once window resources are fully compiled
    const handleLoad = () => setTimeout(() => setLoading(false), 2000);
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]"
        >
          {/* Volumetric ambient background aura */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none animate-pulse" />

          {/* Immersive circular liquid light ring */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [0.92, 1.08, 0.92],
                rotate: 360 
              }}
              transition={{ 
                duration: 7, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute w-44 h-44 rounded-full border border-accent/20 border-t-accent blur-[1px]"
            />
            <motion.div
              animate={{ 
                scale: [1.06, 0.88, 1.06],
                rotate: -360 
              }}
              transition={{ 
                duration: 9, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute w-40 h-40 rounded-full border border-accent/10 border-b-accent/50 blur-[3px]"
            />

            {/* Glowing inner gemstone core */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 25px 2px rgba(212,175,55,0.15)",
                  "0 0 45px 10px rgba(212,175,55,0.35)",
                  "0 0 25px 2px rgba(212,175,55,0.15)"
                ]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="w-24 h-24 rounded-full bg-[#0a0a0a] border border-accent/35 flex items-center justify-center"
            >
              {/* Cinematic gold sparkle vector shape */}
              <svg className="w-9 h-9 text-accent" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="currentColor" />
              </svg>
            </motion.div>
          </div>

          {/* Staggered champagne brand reveal */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8 }}
            className="mt-8 text-center"
          >
            <h2 className="font-headline text-2xl tracking-[0.25em] text-foreground uppercase font-semibold">
              Sparkle Studio
            </h2>
            <p className="text-xs tracking-[0.35em] text-accent/65 uppercase mt-2 font-medium">
              Atelier of Future Luxury
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
