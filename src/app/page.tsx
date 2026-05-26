"use client";

import { motion } from "framer-motion";
import { UserTypeSelection } from '@/components/landing/user-type-selection';
import { PageTransition } from '@/components/ui/page-transition';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { Scene } from '@/components/webgl/Scene';
import Link from "next/link";

// Cinematic Typography Stagger variants
const titleVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.15,
      duration: 1.8,
      ease: [0.25, 1, 0.25, 1] // Apple/Luxury cinematic easing
    }
  })
};

export default function LandingPage() {
  return (
    <PageTransition className="flex flex-col relative w-full bg-transparent min-h-[200vh]" key="landing">
      {/* 3D WebGL Background - Persistent across scroll */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Scene />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        
        <div className="flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl">
          {/* Typography Motion Choreography */}
          <div className="text-mask-container">
            <motion.h1 
              custom={0}
              initial="hidden"
              animate="visible"
              variants={titleVariants}
              className="font-headline text-6xl md:text-8xl lg:text-[11rem] tracking-tight leading-none text-foreground drop-shadow-2xl mix-blend-difference"
            >
              Sparkle
            </motion.h1>
          </div>
          <div className="text-mask-container -mt-2 md:-mt-8">
            <motion.h1 
              custom={1}
              initial="hidden"
              animate="visible"
              variants={titleVariants}
              className="font-headline text-6xl md:text-8xl lg:text-[11rem] tracking-tight leading-none text-accent drop-shadow-2xl mix-blend-difference"
            >
              Studio
            </motion.h1>
          </div>

          <motion.p 
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 2.5, delay: 0.8, ease: [0.25, 1, 0.25, 1] }}
            className="mt-8 text-sm md:text-base text-muted-foreground max-w-2xl font-light tracking-[0.3em] uppercase mix-blend-difference"
          >
            Curating brilliance, one piece at a time.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 1.2, ease: [0.25, 1, 0.25, 1] }}
            className="mt-20 pointer-events-auto"
          >
            <MagneticButton className="px-10 py-5 bg-transparent border border-white/20 text-foreground font-medium tracking-widest uppercase text-[10px] backdrop-blur-md transition-all duration-1000 hover:border-accent hover:text-accent rounded-none hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] luxury-glare-container">
              <Link href="#explore" className="w-full h-full block">Explore Collection</Link>
            </MagneticButton>
          </motion.div>
        </div>
      </div>

      {/* Main Content Section */}
      <div id="explore" className="relative z-10 w-full min-h-screen py-32 px-4 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.8, ease: [0.25, 1, 0.25, 1] }}
          className="w-full max-w-5xl backdrop-blur-md bg-black/10 border border-white/10 p-8 md:p-16 shadow-2xl pointer-events-auto"
        >
          <div className="text-center mb-24 flex flex-col items-center w-full">
            <div className="text-mask-container">
              <motion.h2 
                initial={{ y: "100%", opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: [0.25, 1, 0.25, 1] }}
                className="font-headline text-3xl md:text-5xl text-foreground mb-6 mix-blend-difference"
              >
                Choose Your Path
              </motion.h2>
            </div>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: [0.25, 1, 0.25, 1], delay: 0.2 }}
              className="w-16 h-[1px] bg-accent mx-auto origin-center" 
            />
          </div>
          
          <UserTypeSelection />
        </motion.div>

        <footer className="mt-40 text-center text-muted-foreground/40 text-[10px] font-light uppercase tracking-[0.2em] pointer-events-auto mix-blend-difference">
          <p>&copy; {new Date().getFullYear()} Sparkle Studio. All Rights Reserved.</p>
        </footer>
      </div>
    </PageTransition>
  );
}
