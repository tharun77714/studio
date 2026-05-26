'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, useGLTF, MeshTransmissionMaterial, MeshReflectorMaterial, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

export function CinematicScene() {
  const scroll = useScroll();
  const cameraRef = useRef<THREE.Group>(null);
  const artifactRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group[]>([]);
  
  // Load the Sanctuary architecture from Blender
  const { nodes } = useGLTF('/models/sanctuary.glb') as any;

  useFrame((state) => {
    if (!cameraRef.current || !artifactRef.current) return;

    // Scroll progress (0 to 1 across the 5 pages)
    const offset = scroll.offset;
    const time = state.clock.getElapsedTime();

    // 1. Cinematic Observational Camera Drift (Slow, reverent, exploring)
    // Moving slowly forward and panning gently
    cameraRef.current.position.z = THREE.MathUtils.lerp(12, 4, offset);
    cameraRef.current.position.y = THREE.MathUtils.lerp(3, 1, offset) + Math.sin(time * 0.2) * 0.1;
    cameraRef.current.position.x = Math.sin(time * 0.1) * 0.5;

    // Gentle look-at targeting the artifact
    cameraRef.current.lookAt(0, 2, 0);

    // Mouse Parallax (adds spatial tension)
    const targetX = (state.pointer.x * 0.5);
    const targetY = (state.pointer.y * 0.5);
    cameraRef.current.rotation.y += (targetX * 0.05 - cameraRef.current.rotation.y) * 0.02;
    cameraRef.current.rotation.x += (-targetY * 0.05 - cameraRef.current.rotation.x) * 0.02;

    // 2. Artifact Animation (Watch mechanics / Gemstone floating)
    artifactRef.current.position.y = 2 + Math.sin(time * 0.5) * 0.1;
    artifactRef.current.rotation.y = time * 0.1;
    
    // Rotate rings in opposing directions for complex mechanical beauty
    ringsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const speed = i % 2 === 0 ? 0.2 : -0.3;
      ring.rotation.x = time * speed + (i * Math.PI / 3);
      ring.rotation.y = time * (speed * 0.8);
    });
  });

  return (
    <group ref={cameraRef}>
      {/* 
        LIGHTING PHILOSOPHY: Luxury Product Cinematography 
        Soft reflections, controlled highlights, elegant glow separation.
      */}
      <ambientLight intensity={0.05} />
      
      {/* Cold rim light from the distant left */}
      <spotLight 
        position={[-15, 10, -5]} 
        angle={0.2} 
        penumbra={1} 
        intensity={3} 
        color="#a8b5c2" 
        castShadow 
      />
      
      {/* Soft warm gold highlight from above right, picking up the jewelry artifact */}
      <spotLight 
        position={[10, 15, 5]} 
        angle={0.15} 
        penumbra={1} 
        intensity={4} 
        color="#ffead6" 
        castShadow
      />

      {/* Very faint fill light for architectural volume */}
      <directionalLight position={[0, -5, 10]} intensity={0.2} color="#ffffff" />

      {/* Elegant HDRI Environment for the liquid chrome and glass reflections */}
      <Environment preset="studio" environmentIntensity={0.3} />

      <group>
        {/* ========================================================
            THE WATER FLOOR (Shallow, reflective, calm)
            ======================================================== */}
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={80}
            roughness={0.1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#050505"
            metalness={0.5}
            mirror={1}
          />
        </mesh>

        {/* ========================================================
            THE ARCHITECTURE (Obsidian / Brutalist Minimalism)
            ======================================================== */}
        <mesh geometry={nodes.Wall_Left?.geometry} position={nodes.Wall_Left?.position} scale={nodes.Wall_Left?.scale} castShadow receiveShadow>
          <meshPhysicalMaterial color="#020202" roughness={0.6} metalness={0.8} clearcoat={0.1} />
        </mesh>
        
        <mesh geometry={nodes.Wall_Right?.geometry} position={nodes.Wall_Right?.position} scale={nodes.Wall_Right?.scale} castShadow receiveShadow>
          <meshPhysicalMaterial color="#020202" roughness={0.6} metalness={0.8} clearcoat={0.1} />
        </mesh>
        
        <mesh geometry={nodes.Overhang?.geometry} position={nodes.Overhang?.position} scale={nodes.Overhang?.scale} castShadow receiveShadow>
          <meshPhysicalMaterial color="#000000" roughness={0.9} metalness={0.1} />
        </mesh>

        {/* ========================================================
            THE SANCTUARY PEDESTAL (Brushed Titanium)
            ======================================================== */}
        <mesh geometry={nodes.Pedestal?.geometry} position={nodes.Pedestal?.position} receiveShadow>
          <meshPhysicalMaterial color="#111111" roughness={0.4} metalness={0.9} />
        </mesh>
        <mesh geometry={nodes.Pedestal_Inner?.geometry} position={nodes.Pedestal_Inner?.position} receiveShadow>
          <meshPhysicalMaterial color="#050505" roughness={0.2} metalness={1.0} clearcoat={1.0} />
        </mesh>

        {/* ========================================================
            THE ARTIFACT (Jewelry Showcase - Gold, Glass, Chrome)
            ======================================================== */}
        <group ref={artifactRef}>
          {/* The Gemstone Core: Layered transmission and refraction */}
          <mesh geometry={nodes.Artifact_Core?.geometry}>
            <MeshTransmissionMaterial 
              backside
              samples={6}
              thickness={2}
              chromaticAberration={1.5}
              anisotropy={0.3}
              distortion={0.2}
              distortionScale={0.2}
              temporalDistortion={0.1}
              color="#ffead6"
              emissive="#ff9900"
              emissiveIntensity={0.2}
              metalness={0.1}
              roughness={0.1}
              transmission={1}
              ior={1.6}
            />
          </mesh>

          {/* The Mechanical Rings: Liquid Chrome / Polished Platinum */}
          {[0, 1, 2].map((i) => {
            const ringNode = nodes[`Artifact_Ring_${i}`];
            if (!ringNode) return null;
            return (
              <group 
                key={i} 
                ref={(el) => { if (el) ringsRef.current[i] = el; }}
                position={[0, 0, 0]} // Center locally to the artifactRef
              >
                <mesh geometry={ringNode.geometry} castShadow>
                  <meshPhysicalMaterial 
                    color={i === 1 ? "#ffb703" : "#ffffff"} // Middle ring is gold, others platinum
                    metalness={1.0}
                    roughness={0.05}
                    clearcoat={1.0}
                    envMapIntensity={2.0}
                  />
                </mesh>
              </group>
            );
          })}
        </group>

      </group>
    </group>
  );
}

useGLTF.preload('/models/sanctuary.glb');
