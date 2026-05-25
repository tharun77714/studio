"use client";

import { EffectComposer, Bloom, DepthOfField, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

export function PostprocessingStack() {
  return (
    <EffectComposer disableNormalPass multisampling={4}>
      {/* Cinematic Depth of Field */}
      <DepthOfField 
        focusDistance={0.02} 
        focalLength={0.05} 
        bokehScale={3} 
        height={480} 
      />
      
      {/* Subtle Luxury Bloom */}
      <Bloom 
        luminanceThreshold={0.6} 
        luminanceSmoothing={0.9} 
        height={300} 
        opacity={0.8} 
        mipmapBlur 
      />
      
      {/* Cinematic Film Grain / Noise */}
      <Noise 
        opacity={0.04} 
        blendFunction={BlendFunction.OVERLAY} 
      />
      
      {/* Atmospheric Vignette */}
      <Vignette 
        eskil={false} 
        offset={0.15} 
        darkness={1.2} 
        blendFunction={BlendFunction.MULTIPLY}
      />
      
      {/* Subtle edge separation for realism */}
      <ChromaticAberration 
        offset={new THREE.Vector2(0.0008, 0.0008)} 
        blendFunction={BlendFunction.NORMAL} 
      />
    </EffectComposer>
  );
}
