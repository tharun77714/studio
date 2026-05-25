"use client";

import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Sparkles, Float } from '@react-three/drei';
import { LuxuryObject } from './LuxuryObject';
import { PostprocessingStack } from './PostprocessingStack';
import { CameraRig } from './CameraRig';
import { AdaptivePerformance } from './AdaptivePerformance';

export function Scene() {
  const [performanceMode, setPerformanceMode] = useState<'ultra' | 'safe'>('ultra');

  return (
    <div className="absolute inset-0 z-0 pointer-events-none bg-black">
      <Canvas
        shadows
        gl={{ 
          antialias: false, // Disabled because postprocessing handles AA (multisampling)
          powerPreference: "high-performance",
          alpha: true 
        }}
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 2]} // Initial adaptive DPR
      >
        <Suspense fallback={null}>
          <AdaptivePerformance setPerformanceMode={setPerformanceMode}>
            <color attach="background" args={['#050505']} /> {/* Matte Charcoal Background */}
            
            {/* Cinematic Depth Fog */}
            <fog attach="fog" args={['#050505', 4, 12]} /> 

            {/* HDRI Environment for realistic reflections & film-grade lighting */}
            <Environment preset="studio" environmentIntensity={0.5} /> 

            {/* Moving Soft Light Sweeps */}
            <ambientLight intensity={0.15} />
            <directionalLight 
              position={[5, 10, 5]} 
              intensity={2.5} 
              castShadow 
              shadow-mapSize={[1024, 1024]}
              color="#ffffff"
            />
            {/* Volumetric-like Rim Light */}
            <spotLight 
              position={[-8, 5, -5]} 
              intensity={8} 
              color="#e0c26e" 
              angle={0.8} 
              penumbra={1} 
              castShadow 
            />

            {/* Procedural Particle Systems: Restrained and expensive */}
            {performanceMode === 'ultra' && (
              <>
                <Sparkles count={40} scale={12} size={1.5} speed={0.05} opacity={0.15} color="#ffffff" />
                <Sparkles count={15} scale={8} size={3} speed={0.02} opacity={0.1} color="#e0c26e" />
              </>
            )}

            {/* Midground 3D */}
            <Float speed={0.8} rotationIntensity={0.3} floatIntensity={0.4}>
              <LuxuryObject />
            </Float>

            {/* Camera Choreography */}
            <CameraRig />

            {/* Postprocessing Stack */}
            {performanceMode === 'ultra' && <PostprocessingStack />}
          </AdaptivePerformance>
        </Suspense>
      </Canvas>
    </div>
  );
}
