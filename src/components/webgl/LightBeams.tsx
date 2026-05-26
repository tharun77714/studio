"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom GLSL shader for the iridescent light beam rays
const lightBeamVertexShader = `
  varying vec2 vUv;
  varying float vElevation;
  void main() {
    vUv = uv;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vElevation = modelPosition.y;
    gl_Position = projectionMatrix * viewMatrix * modelPosition;
  }
`;

const lightBeamFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    // Radial fade from center axis
    float distFromCenter = abs(vUv.x - 0.5) * 2.0;
    float radialFade = 1.0 - smoothstep(0.0, 1.0, distFromCenter);
    
    // Vertical fade (bright at gem, fades out)
    float vertFade = smoothstep(1.0, 0.0, vUv.y);
    
    // Animated shimmer
    float shimmer = sin(uTime * 1.5 + vUv.y * 8.0) * 0.15 + 0.85;
    
    // Gold color with warm iridescence
    float hShift = sin(uTime * 0.5 + vUv.y * 3.0) * 0.05;
    vec3 goldColor = vec3(0.88 + hShift, 0.72, 0.28);
    vec3 blueShift = vec3(0.4, 0.7, 1.0);
    vec3 finalColor = mix(goldColor, blueShift, sin(uTime * 0.3) * 0.15 + 0.15);
    
    float alpha = radialFade * vertFade * shimmer * uOpacity;
    gl_FragColor = vec4(finalColor, alpha * 0.35);
  }
`;

export function LightBeams({ count = 6 }: { count?: number }) {
  const beamRefs = useRef<(THREE.Mesh | null)[]>([]);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1.0 },
  }), []);

  const angles = useMemo(() => 
    Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2),
    [count]
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group>
      {angles.map((angle, i) => (
        <mesh
          key={i}
          ref={el => { beamRefs.current[i] = el; }}
          position={[
            Math.cos(angle) * 0.1,
            -0.6,
            Math.sin(angle) * 0.1
          ]}
          rotation={[0, angle, 0]}
        >
          <planeGeometry args={[0.08, 3.5, 1, 16]} />
          <shaderMaterial
            vertexShader={lightBeamVertexShader}
            fragmentShader={lightBeamFragmentShader}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
