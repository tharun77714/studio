'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Loader, Html } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from '@react-three/postprocessing';
import { CinematicScene } from '@/components/webgl/CinematicScene';

export default function Home() {
  return (
    <main className="relative w-full h-screen bg-[#020202] overflow-hidden">
      {/* 
        Ultra-minimal HTML UI Layer - Will emerge in Phase 5 
        Using pointer-events-none so it doesn't block WebGL interactions
      */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-12 mix-blend-difference">
        <header className="flex justify-between items-center text-zinc-100 transition-opacity duration-1000">
          <div className="font-mono text-xs tracking-[0.3em] uppercase">Studio / AI</div>
          <nav className="flex gap-8 text-xs tracking-widest font-medium">
            <span className="cursor-pointer pointer-events-auto hover:text-white/70 transition-colors">VISION</span>
            <span className="cursor-pointer pointer-events-auto hover:text-white/70 transition-colors">ARCHIVE</span>
            <span className="cursor-pointer pointer-events-auto hover:text-white/70 transition-colors">ENTER</span>
          </nav>
        </header>
        
        <div className="flex justify-between items-end pb-8">
          <h1 className="text-zinc-100 font-light tracking-tighter leading-none" style={{ fontSize: 'clamp(3rem, 8vw, 8rem)' }}>
            NEW<br/>SPARKLE
          </h1>
          <div className="font-mono text-[10px] tracking-widest text-zinc-400 text-right uppercase">
            Scroll to initialize <br/> spatial environment
          </div>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 10], fov: 35 }}
        gl={{ 
          antialias: false, // Disabled for post-processing performance
          powerPreference: "high-performance",
          alpha: false 
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#020202']} />
        
        {/* Subtle, distant cyan fog (Blade Runner atmosphere) */}
        <fog attach="fog" args={['#050810', 8, 30]} />

        <Suspense fallback={
          <Html center>
            <div className="text-white text-xs uppercase tracking-widest font-mono">Loading Space...</div>
          </Html>
        }>
          <ScrollControls pages={5} damping={0.15}>
            <CinematicScene />
          </ScrollControls>
        </Suspense>

        <EffectComposer disableNormalPass multisampling={4}>
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
          {/* Subtle cinematic bloom for the gold/chrome core */}
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} intensity={1.5} mipmapBlur />
          {/* Film grain for the Denis Villeneuve analog/digital feel */}
          <Noise opacity={0.035} />
          {/* Heavy vignette for tension and framing */}
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
      <Loader />
    </main>
  );
}
