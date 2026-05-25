"use client";

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function LuxuryObject() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Confident, slow rotation embracing the Silence philosophy
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.x += delta * 0.05;
      
      // Subtle cinematic floating
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      {/* High polygon count for ultra-smooth reflections */}
      <torusGeometry args={[1.5, 0.45, 128, 256]} />
      
      {/* Custom Shader-like Transmission Material for hyper-real glass/liquid refraction */}
      <MeshTransmissionMaterial
        backside
        samples={16}
        resolution={1024}
        transmission={0.95}
        roughness={0.08}
        thickness={2.5}
        ior={1.6}
        chromaticAberration={0.04}
        anisotropy={0.2}
        distortion={0.3}
        distortionScale={0.4}
        temporalDistortion={0.05}
        color="#ffffff"
        attenuationDistance={1.2}
        attenuationColor="#e0c26e" // Champagne Gold attenuation
      />
    </mesh>
  );
}
