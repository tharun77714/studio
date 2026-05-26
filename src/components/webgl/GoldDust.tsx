"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GoldDustProps {
  count?: number;
  radius?: number;
  speed?: number;
}

export function GoldDust({ count = 80, radius = 2.8, speed = 0.12 }: GoldDustProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Precompute orbit params for each particle
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      orbitRadius: radius * (0.6 + Math.random() * 0.7),
      orbitSpeed: speed * (0.3 + Math.random() * 1.4) * (Math.random() > 0.5 ? 1 : -1),
      orbitTilt: (Math.random() - 0.5) * Math.PI,        // random orbital plane
      orbitPhase: Math.random() * Math.PI * 2,            // start offset
      verticalDrift: (Math.random() - 0.5) * 2.2,
      size: 0.008 + Math.random() * 0.022,
      brightness: 0.5 + Math.random() * 0.5,
    }));
  }, [count, radius, speed]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      const angle = t * p.orbitSpeed + p.orbitPhase;

      // Orbit on tilted plane
      const x = Math.cos(angle) * p.orbitRadius;
      const z = Math.sin(angle) * p.orbitRadius;
      
      // Apply orbit tilt via rotation
      dummy.position.set(
        x * Math.cos(p.orbitTilt) - p.verticalDrift * Math.sin(p.orbitTilt) * 0.3,
        x * Math.sin(p.orbitTilt) + Math.sin(t * 0.3 + p.orbitPhase) * 0.2,
        z
      );

      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // Gold → warm white shimmer
      const shimmer = p.brightness * (0.8 + Math.sin(t * 2.5 + i) * 0.2);
      color.setHSL(0.12, 0.85, shimmer * 0.65);
      meshRef.current!.setColorAt(i, color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={2.0}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
