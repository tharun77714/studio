"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { UserTypeSelection } from '@/components/landing/user-type-selection';
import { PageTransition } from '@/components/ui/page-transition';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { Scene } from '@/components/webgl/Scene';
import Link from "next/link";

// Cinematic stagger variants
const titleVariants = {
  hidden: { y: "110%", opacity: 0, rotateX: 15 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      delay: i * 0.18,
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-linked Framer Motion transforms
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  // Hero text fades and lifts as user scrolls into the gem
  const heroOpacity = useTransform(smoothProgress, [0, 0.18], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 0.18], [0, -80]);
  const heroScale = useTransform(smoothProgress, [0, 0.18], [1, 0.92]);

  // Subtitle pill fades in after title
  const subtitleOpacity = useTransform(smoothProgress, [0.02, 0.18], [1, 0]);

  // Scroll indicator
  const indicatorOpacity = useTransform(smoothProgress, [0, 0.05], [1, 0]);

  return (
    <PageTransition
      className="flex flex-col relative w-full bg-transparent"
      style={{ minHeight: "240vh" }}
      key="landing"
      ref={containerRef}
    >
      {/* 3D WebGL — Fixed, always behind everything */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Scene />
      </div>

      {/* ============ HERO SECTION ============ */}
      <div className="sticky top-0 z-10 h-screen w-full flex flex-col items-center justify-center overflow-hidden pointer-events-none">
        
        {/* Radial glow behind text */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(224,194,110,0.06) 0%, transparent 70%)",
          }}
        />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className="flex flex-col items-center text-center px-4 w-full max-w-6xl"
        >
          {/* Category pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 px-5 py-2 border border-white/10 rounded-full text-[10px] font-medium tracking-[0.35em] uppercase text-white/40 backdrop-blur-sm"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            Fine Jewellery · AI Platform · India
          </motion.div>

          {/* SPARKLE — letter mask reveal */}
          <div style={{ overflow: "hidden", perspective: "1200px" }}>
            <motion.h1
              custom={0}
              initial="hidden"
              animate="visible"
              variants={titleVariants}
              className="font-headline text-[5rem] sm:text-[8rem] lg:text-[10.5rem] xl:text-[13rem] tracking-[-0.03em] leading-[0.88] text-white"
              style={{
                textShadow: "0 0 120px rgba(224,194,110,0.12)",
                fontWeight: 700,
              }}
            >
              Sparkle
            </motion.h1>
          </div>

          {/* STUDIO — accent color */}
          <div style={{ overflow: "hidden", perspective: "1200px", marginTop: "-0.05em" }}>
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={titleVariants}
              className="font-headline text-[5rem] sm:text-[8rem] lg:text-[10.5rem] xl:text-[13rem] tracking-[-0.03em] leading-[0.88]"
              style={{
                background: "linear-gradient(135deg, #e0c26e 0%, #f7e9b5 40%, #c8a040 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 700,
                filter: "drop-shadow(0 0 60px rgba(224,194,110,0.25))",
              }}
            >
              Studio
            </motion.h1>
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, filter: "blur(16px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 text-xs sm:text-sm tracking-[0.35em] uppercase font-light"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Curating brilliance — one piece at a time
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 flex items-center gap-5 pointer-events-auto"
          >
            {/* Primary CTA */}
            <MagneticButton
              className="px-8 py-4 text-[10px] font-semibold tracking-[0.3em] uppercase rounded-none border transition-all duration-700"
              style={{
                background: "linear-gradient(135deg, rgba(224,194,110,0.15) 0%, rgba(224,194,110,0.05) 100%)",
                borderColor: "rgba(224,194,110,0.4)",
                color: "#e0c26e",
                backdropFilter: "blur(12px)",
              }}
            >
              <Link href="#explore" className="block w-full h-full">
                Explore Collection
              </Link>
            </MagneticButton>

            {/* Ghost secondary */}
            <MagneticButton
              className="px-8 py-4 text-[10px] font-medium tracking-[0.3em] uppercase rounded-none border border-white/10 text-white/40 hover:border-white/20 hover:text-white/60 transition-all duration-700"
              style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.02)" }}
            >
              <Link href="/sign-in" className="block w-full h-full">
                Sign In
              </Link>
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Scroll indicator — fades out after slight scroll */}
        <motion.div
          style={{ opacity: indicatorOpacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-[1px] h-12 origin-top"
            style={{ background: "linear-gradient(to bottom, rgba(224,194,110,0.6), transparent)" }}
          />
          <p className="text-[9px] tracking-[0.4em] uppercase text-white/25">Scroll</p>
        </motion.div>
      </div>

      {/* ============ CHOOSE YOUR PATH SECTION ============ */}
      <div
        id="explore"
        className="relative z-10 w-full py-40 px-4 flex flex-col items-center"
        style={{ minHeight: "100vh" }}
      >
        {/* Glass panel */}
        <motion.div
          initial={{ opacity: 0, y: 80, filter: "blur(20px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-5xl"
        >
          {/* Header */}
          <div className="text-center mb-20 flex flex-col items-center">
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              whileInView={{ opacity: 1, letterSpacing: "0.35em" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-[9px] font-semibold uppercase text-white/30 mb-6"
            >
              Begin Your Journey
            </motion.p>

            <div style={{ overflow: "hidden" }}>
              <motion.h2
                initial={{ y: "100%" }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-headline text-4xl md:text-6xl font-bold text-white tracking-tight"
              >
                Choose Your Path
              </motion.h2>
            </div>

            {/* Animated gold line */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 h-[1px] w-20 origin-center"
              style={{ background: "linear-gradient(90deg, transparent, #e0c26e, transparent)" }}
            />
          </div>

          <UserTypeSelection />
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={fadeUp.hidden}
          whileInView={fadeUp.visible as any}
          viewport={{ once: true }}
          className="mt-32 text-center"
          style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px", letterSpacing: "0.25em" }}
        >
          <p className="uppercase">© {new Date().getFullYear()} Sparkle Studio · All Rights Reserved</p>
        </motion.footer>
      </div>
    </PageTransition>
  );
}
