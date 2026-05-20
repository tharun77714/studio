"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { UserTypeSelection } from '@/components/landing/user-type-selection';
import { PageTransition } from '@/components/ui/page-transition';
import { SvgDrawSparkle } from '@/components/ui/svg-draw-sparkle';
import { TextReveal } from '@/components/ui/text-reveal';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { GoldDustCanvas } from '@/components/landing/gold-dust-canvas';
import { useRef } from "react";
import Link from "next/link";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <PageTransition className="flex flex-col relative w-full bg-background min-h-[150vh]" key="landing">
      <div ref={containerRef} className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        {/* Cinematic Particles */}
        <GoldDustCanvas />

        {/* Parallax Background Orbs */}

        <motion.div 
          style={{ y: yBackground }}
          className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-40"
        >
          <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] rounded-full bg-accent/5 blur-[150px]" />
        </motion.div>

        {/* Hero Section */}
        <motion.div 
          style={{ y: yText, opacity: opacityText }}
          className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl"
        >
          <div className="mb-12 relative w-32 h-32 flex items-center justify-center">
             <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl" />
             <SvgDrawSparkle className="w-20 h-20" />
          </div>

          <TextReveal 
            text="Sparkle Studio" 
            className="font-headline text-6xl md:text-8xl lg:text-[10rem] tracking-tight leading-none text-foreground drop-shadow-2xl"
          />

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 text-xl md:text-2xl text-muted-foreground/80 max-w-2xl font-light tracking-wide uppercase"
          >
            Curating brilliance, one piece at a time.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16"
          >
            <MagneticButton className="px-8 py-4 bg-primary text-primary-foreground font-semibold tracking-widest uppercase text-sm shadow-[0_0_40px_rgba(212,175,55,0.2)] hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] border border-primary/50 transition-shadow duration-500 rounded-none">
              <Link href="#explore" className="w-full h-full block">Explore Collection</Link>
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>

      {/* Main Content Section */}
      <div id="explore" className="relative z-20 w-full min-h-screen bg-card py-32 px-4 flex flex-col items-center border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-5xl"
        >
          <div className="text-center mb-24">
             <h2 className="font-headline text-4xl md:text-6xl text-foreground mb-6">Choose Your Path</h2>
             <div className="w-24 h-[1px] bg-primary mx-auto opacity-50" />
          </div>
          
          <UserTypeSelection />
        </motion.div>

        <footer className="mt-32 text-center text-muted-foreground/40 text-xs font-light uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} Sparkle Studio. All Rights Reserved.</p>
        </footer>
      </div>
    </PageTransition>
  );
}
