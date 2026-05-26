"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Creates a procedural diamond/gem shape by combining two pyramids (octahedron-like but sharpened)
function createDiamondGeometry() {
  const geometry = new THREE.BufferGeometry();

  const crown_h = 0.55;  // top crown height
  const girdle_r = 1.0;  // girdle radius (widest point)
  const pavilion_h = 1.2; // bottom pavilion height (longer, more dramatic)
  const table_r = 0.48;  // table facet radius (flat top)
  const crown_segments = 8;
  const pavilion_segments = 8;

  const positions: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  const tableY = crown_h;
  const girdleY = 0;
  const culetY = -pavilion_h;

  // Table vertices (flat top)
  const tableStart = 0;
  for (let i = 0; i < crown_segments; i++) {
    const angle = (i / crown_segments) * Math.PI * 2;
    positions.push(
      Math.cos(angle) * table_r, tableY, Math.sin(angle) * table_r
    );
    normals.push(0, 1, 0);
  }

  // Girdle vertices (widest point)
  const girdleStart = crown_segments;
  for (let i = 0; i < crown_segments; i++) {
    const angle = (i / crown_segments) * Math.PI * 2 + Math.PI / crown_segments;
    positions.push(
      Math.cos(angle) * girdle_r, girdleY, Math.sin(angle) * girdle_r
    );
    normals.push(
      Math.cos(angle), 0.2, Math.sin(angle)
    );
  }

  // Culet (bottom point)
  const culetIdx = positions.length / 3;
  positions.push(0, culetY, 0);
  normals.push(0, -1, 0);

  // Table facet (top flat polygon)
  for (let i = 0; i < crown_segments - 2; i++) {
    indices.push(tableStart, tableStart + i + 1, tableStart + i + 2);
  }

  // Crown facets (table to girdle)
  for (let i = 0; i < crown_segments; i++) {
    const next = (i + 1) % crown_segments;
    const t1 = tableStart + i;
    const t2 = tableStart + next;
    const g1 = girdleStart + i;
    const g2 = girdleStart + next;
    indices.push(t1, g1, t2);
    indices.push(t2, g1, g2);
  }

  // Pavilion facets (girdle to culet)
  for (let i = 0; i < pavilion_segments; i++) {
    const next = (i + 1) % pavilion_segments;
    indices.push(
      girdleStart + i,
      culetIdx,
      girdleStart + next
    );
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals(); // recompute for proper lighting
  return geometry;
}

export function DiamondGem({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  
  const diamondGeometry = useMemo(() => createDiamondGeometry(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Elegant slow auto-rotation with scroll-influenced Y spin
    meshRef.current.rotation.y += delta * (0.08 + scrollProgress * 0.2);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      Math.sin(t * 0.15) * 0.08 + scrollProgress * 0.3,
      0.05
    );

    // Cinematic float
    meshRef.current.position.y = Math.sin(t * 0.4) * 0.12;

    // Scale pulse on scroll reveal
    const targetScale = 0.7 + scrollProgress * 0.1;
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.04)
    );

    // Outer ring slow counter-rotation
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x += delta * 0.05;
      outerRingRef.current.rotation.z -= delta * 0.03;
    }
  });

  return (
    <group>
      {/* Main Diamond */}
      <mesh ref={meshRef} geometry={diamondGeometry} castShadow>
        <MeshTransmissionMaterial
          backside
          backsidethickness={0.4}
          samples={12}
          resolution={512}
          transmission={0.98}
          roughness={0.0}
          thickness={1.8}
          ior={2.4}                        // Diamond IOR
          chromaticAberration={0.08}       // Rainbow dispersion
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.2}
          temporalDistortion={0.02}
          color="#f0f8ff"                  // Ice white
          attenuationDistance={0.8}
          attenuationColor="#c9e8ff"       // Pale icy blue attenuation
          envMapIntensity={2.5}
        />
      </mesh>

      {/* Outer orbiting gold ring */}
      <mesh ref={outerRingRef} castShadow>
        <torusGeometry args={[1.7, 0.025, 16, 120]} />
        <meshStandardMaterial
          color="#c8a951"
          metalness={1.0}
          roughness={0.05}
          envMapIntensity={3.0}
          emissive="#7a5e10"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Inner thin accent ring at girdle */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.02, 0.012, 12, 100]} />
        <meshStandardMaterial
          color="#e0c26e"
          metalness={1.0}
          roughness={0.02}
          envMapIntensity={4.0}
          emissive="#e0c26e"
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}
