"use client";

import { motion } from "framer-motion";
import { UserTypeSelection } from '@/components/landing/user-type-selection';
import { AnimatedSparkleIcon } from '@/components/common/animated-sparkle-icon';
import { PageTransition } from '@/components/ui/page-transition';

export default function LandingPage() {
  return (
    <PageTransition className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-background to-secondary/30 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center mb-16 relative z-10"
      >
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="inline-block p-5 rounded-full bg-primary/10 mb-8 backdrop-blur-md border border-primary/20 shadow-[0_0_30px_rgba(255,215,0,0.15)]"
        >
          <AnimatedSparkleIcon className="h-20 w-20 text-primary drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" strokeWidth={1} />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="font-headline text-6xl md:text-8xl font-medium tracking-tight text-foreground bg-clip-text"
        >
          Sparkle Studio
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed"
        >
          Curating brilliance, one piece at a time. Discover your next favorite jewelry piece or showcase your collection.
        </motion.p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="w-full max-w-4xl relative z-10"
      >
        <UserTypeSelection />
      </motion.div>

      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 text-center text-muted-foreground/60 text-sm font-light"
      >
        <p>&copy; {new Date().getFullYear()} Sparkle Studio.</p>
      </motion.footer>
    </PageTransition>
  );
}
