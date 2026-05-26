'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, useGLTF, MeshTransmissionMaterial, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

export function CinematicScene() {
  const scroll = useScroll();
  const monolithRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  // Load the fractured basalt shards from Blender
  const { nodes } = useGLTF('/models/monolith.glb') as any;

  // Extract all the shard meshes from the GLB
  const shards = useMemo(() => {
    return Object.values(nodes).filter((node: any) => node.isMesh) as THREE.Mesh[];
  }, [nodes]);

  // Initial random translation targets for the explosion/fracture
  const shardTargets = useMemo(() => {
    return shards.map((shard) => {
      // Calculate a direction vector outward from the center
      const pos = shard.position.clone();
      const dir = pos.clone().normalize();
      // Add some random scatter and heavy Y drift
      return {
        targetPos: new THREE.Vector3(
          pos.x + dir.x * (Math.random() * 4 + 2),
          pos.y + dir.y * (Math.random() * 4 + 2) + (Math.random() * 2),
          pos.z + dir.z * (Math.random() * 4 + 2)
        ),
        targetRot: new THREE.Vector3(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )
      };
    });
  }, [shards]);

  useFrame((state) => {
    if (!monolithRef.current || !cameraRef.current || !coreRef.current) return;

    // Scroll progress (0 to 1 across the 5 pages)
    const offset = scroll.offset;

    // Cinematic Handheld Camera Drift (Constant)
    const time = state.clock.getElapsedTime();
    cameraRef.current.position.x = Math.sin(time * 0.3) * 0.2;
    cameraRef.current.position.y = Math.cos(time * 0.2) * 0.2;

    // Mouse Parallax (Subtle spatial tension)
    const targetX = (state.pointer.x * 2);
    const targetY = (state.pointer.y * 2);
    cameraRef.current.rotation.y += (targetX * 0.05 - cameraRef.current.rotation.y) * 0.02;
    cameraRef.current.rotation.x += (-targetY * 0.05 - cameraRef.current.rotation.x) * 0.02;

    // ==========================================
    // PHASE 2: The Fracture (Offset 0.1 to 0.4)
    // ==========================================
    const fractureProgress = Math.max(0, Math.min(1, (offset - 0.1) * 3.33));
    
    monolithRef.current.children.forEach((child, i) => {
      const target = shardTargets[i];
      if (!target) return;
      
      // Interpolate from original position to fractured position based on scroll
      // Use easeOut-like curve for magnetic separation feeling
      const ease = 1 - Math.pow(1 - fractureProgress, 3);
      
      child.position.lerpVectors(shards[i].position, target.targetPos, ease);
      
      // Add slight magnetic rotation
      child.rotation.x = THREE.MathUtils.lerp(shards[i].rotation.x, target.targetRot.x, ease * 0.5);
      child.rotation.y = THREE.MathUtils.lerp(shards[i].rotation.y, target.targetRot.y, ease * 0.5);
      child.rotation.z = THREE.MathUtils.lerp(shards[i].rotation.z, target.targetRot.z, ease * 0.5);
    });

    // Animate the core material (breathing/pulsing light)
    const coreMat = coreRef.current.material as THREE.MeshPhysicalMaterial;
    coreMat.emissiveIntensity = 2 + Math.sin(time * 2) * 0.5 + (fractureProgress * 5);
    coreRef.current.scale.setScalar(1 + (fractureProgress * 0.5) + Math.sin(time) * 0.02);
  });

  return (
    <group ref={cameraRef}>
      {/* Lighting Philosophy: Cinematic Rim & Shadows */}
      <ambientLight intensity={0.1} />
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={2} 
        color="#a8b5c2" // Cold silver rim light
        castShadow 
      />
      <spotLight 
        position={[5, 10, 5]} 
        angle={0.15} 
        penumbra={1} 
        intensity={5} 
        color="#d1d9e0" // Soft platinum
        castShadow
      />
      
      {/* 
        HDRI Environment for the physical reflections. 
        Using a dark studio preset to keep the background pitch black but provide reflections.
      */}
      <Environment preset="studio" />

      {/* The Monolith */}
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={monolithRef} position={[0, -1, 0]} rotation={[0.2, -0.5, 0.1]}>
          {shards.map((shard, i) => (
            <mesh 
              key={i} 
              geometry={shard.geometry} 
              position={shard.position} 
              rotation={shard.rotation}
              castShadow
              receiveShadow
            >
              {/* Obsidian Black Material */}
              <meshPhysicalMaterial 
                color="#050505"
                metalness={0.8}
                roughness={0.2}
                clearcoat={1}
                clearcoatRoughness={0.1}
                envMapIntensity={0.5}
              />
            </mesh>
          ))}

          {/* 
            The Core: Hybrid Crystalline / Liquid Chrome 
            Placed exactly in the center of the monolith, revealed during fracture.
          */}
          <mesh ref={coreRef} position={[0, 0, 0]}>
            <octahedronGeometry args={[1.5, 2]} />
            <MeshTransmissionMaterial 
              backside
              samples={4}
              thickness={2}
              chromaticAberration={1}
              anisotropy={0.5}
              distortion={0.5}
              distortionScale={0.5}
              temporalDistortion={0.2}
              color="#ffb703" // Molten gold
              emissive="#ff8800"
              emissiveIntensity={2}
              metalness={0.5}
              roughness={0.1}
              transmission={1}
              ior={1.5}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

useGLTF.preload('/models/monolith.glb');
