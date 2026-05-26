'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { CinematicScene } from '@/components/webgl/CinematicScene';

export default function Home() {
  return (
    <main className="relative w-full h-screen bg-[#020202] overflow-hidden">
      {/* Minimal UI overlay — mix-blend-difference makes it ghost over the 3D */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-12">
        <header className="flex justify-between items-center">
          <div
            className="font-mono text-[10px] tracking-[0.4em] uppercase"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Sparkle Studio
          </div>
          <nav className="flex gap-8">
            {['Vision', 'Archive', 'Enter'].map((item) => (
              <span
                key={item}
                className="pointer-events-auto cursor-pointer font-mono text-[10px] tracking-[0.3em] uppercase transition-colors duration-500"
                style={{ color: 'rgba(255,255,255,0.2)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
              >
                {item}
              </span>
            ))}
          </nav>
        </header>

        <div className="flex justify-between items-end pb-8">
          <h1
            className="font-light tracking-tighter leading-[0.85]"
            style={{
              fontSize: 'clamp(3rem, 8vw, 8rem)',
              color: 'rgba(255,255,255,0.06)',
              mixBlendMode: 'difference',
            }}
          >
            NEW<br />SPARKLE
          </h1>
          <div
            className="font-mono text-[9px] tracking-[0.3em] text-right uppercase"
            style={{ color: 'rgba(255,255,255,0.12)' }}
          >
            Scroll to enter<br />the sanctuary
          </div>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 1.2, 15], fov: 45, near: 0.1, far: 100 }}
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 0.8,
        }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#020202']} />
        <fog attach="fog" args={['#050810', 12, 55]} />

        <Suspense
          fallback={
            <Html center>
              <div
                className="font-mono text-[10px] uppercase tracking-[0.4em]"
                style={{ color: 'rgba(255,255,255,0.15)' }}
              >
                Initializing environment...
              </div>
            </Html>
          }
        >
          <ScrollControls pages={5} damping={0.12}>
            <CinematicScene />
          </ScrollControls>
        </Suspense>

        <EffectComposer disableNormalPass multisampling={0}>
          {/* Restrained bloom — only catches the gold accents and light shafts */}
          <Bloom
            luminanceThreshold={0.8}
            luminanceSmoothing={0.5}
            intensity={0.4}
            mipmapBlur
          />
          {/* Film grain — analog/cinematic texture */}
          <Noise opacity={0.03} />
          {/* Heavy vignette — cinematic framing */}
          <Vignette eskil={false} offset={0.15} darkness={1.3} />
        </EffectComposer>
      </Canvas>
    </main>
  );
}
