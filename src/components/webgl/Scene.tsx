"use client";

import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import { DiamondGem } from './DiamondGem';
import { GoldDust } from './GoldDust';
import { LightBeams } from './LightBeams';
import { PostprocessingStack } from './PostprocessingStack';
import { CameraRig } from './CameraRig';
import { AdaptivePerformance } from './AdaptivePerformance';

function ScrollTracker({ onScroll }: { onScroll: (v: number) => void }) {
  useEffect(() => {
    const handle = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      onScroll(maxScroll > 0 ? window.scrollY / maxScroll : 0);
    };
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, [onScroll]);
  return null;
}

export function Scene() {
  const [performanceMode, setPerformanceMode] = useState<'ultra' | 'safe'>('ultra');
  const [scrollProgress, setScrollProgress] = useState(0);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none bg-[#030303]">
      <ScrollTracker onScroll={setScrollProgress} />
      <Canvas
        shadows
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
          toneMapping: 4, // ACESFilmicToneMapping
          toneMappingExposure: 1.2,
        }}
        camera={{ position: [0, 0, 7], fov: 42 }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <AdaptivePerformance setPerformanceMode={setPerformanceMode}>
            
            {/* Deep space background */}
            <color attach="background" args={['#030303']} />
            
            {/* Subtle depth fog */}
            <fog attach="fog" args={['#030303', 6, 16]} />

            {/* HDRI Studio Lighting — realistic reflections on diamond */}
            <Environment preset="studio" environmentIntensity={0.8} />

            {/* Primary Key Light (warm, cinematic) */}
            <directionalLight
              position={[4, 8, 4]}
              intensity={3.0}
              castShadow
              shadow-mapSize={[2048, 2048]}
              color="#fff8f0"
            />

            {/* Cool fill light (ice blue counter) */}
            <directionalLight
              position={[-5, 3, -3]}
              intensity={1.2}
              color="#b0d4ff"
            />

            {/* Warm gold rim light */}
            <spotLight
              position={[0, -4, 3]}
              intensity={12}
              color="#e0c26e"
              angle={0.5}
              penumbra={1.0}
              castShadow
            />

            {/* Ambient fill — very dark, just enough for deep shadows */}
            <ambientLight intensity={0.08} color="#1a1a2e" />

            {/* === MAIN 3D GEM COMPOSITION === */}
            <Float
              speed={0.6}
              rotationIntensity={0.15}
              floatIntensity={0.25}
            >
              {/* Diamond gem */}
              <DiamondGem scrollProgress={scrollProgress} />
              
              {/* Caustic light beams below the gem */}
              {performanceMode === 'ultra' && (
                <LightBeams count={8} />
              )}
            </Float>

            {/* Gold orbiting dust cloud — instanced for performance */}
            {performanceMode === 'ultra' && (
              <GoldDust count={60} radius={2.6} speed={0.1} />
            )}

            {/* Subtle contact shadow on invisible floor */}
            <ContactShadows
              position={[0, -2.2, 0]}
              opacity={0.4}
              scale={6}
              blur={2.5}
              far={3}
              color="#c8a951"
            />

            {/* Camera Choreography */}
            <CameraRig />

            {/* Postprocessing */}
            {performanceMode === 'ultra' && <PostprocessingStack />}

          </AdaptivePerformance>
        </Suspense>
      </Canvas>
    </div>
  );
}
