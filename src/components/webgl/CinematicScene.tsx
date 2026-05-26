'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

/* ─────────────────────────────────────────────
   ATMOSPHERIC DUST PARTICLES
   Suspended in volumetric fog — cinematic silence
   ───────────────────────────────────────────── */
function DustParticles({ count = 300 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.y = t * 0.003;
    // Extremely slow vertical drift
    const posArray = mesh.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArray[i * 3 + 1] += Math.sin(t * 0.1 + i) * 0.0005;
    }
    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#c4b38a"
        size={0.015}
        transparent
        opacity={0.25}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ─────────────────────────────────────────────
   VOLUMETRIC FOG LAYER
   Flat planes with gradient opacity at different depths
   Creating atmospheric depth corridors
   ───────────────────────────────────────────── */
function FogLayer({
  position,
  scale,
  opacity = 0.08,
  color = '#0a0d14',
}: {
  position: [number, number, number];
  scale: [number, number];
  opacity?: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={[0, 0, 0]}>
      <planeGeometry args={scale} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────
   ARCHITECTURAL WALL
   A single massive slab with hybrid obsidian/titanium material
   ───────────────────────────────────────────── */
function ArchWall({
  position,
  scale,
  rotation = [0, 0, 0],
  color = '#080808',
  metalness = 0.7,
  roughness = 0.35,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={scale} />
      <meshPhysicalMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        clearcoat={0.3}
        clearcoatRoughness={0.2}
        envMapIntensity={0.4}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────
   LIGHT SHAFT
   A narrow, bright volume simulating godray slicing through fog
   ───────────────────────────────────────────── */
function LightShaft({
  position,
  rotation = [0, 0, 0],
  scale = [0.15, 20, 40],
  color = '#e8dcc8',
  opacity = 0.04,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  opacity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={scale} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────
   GOLD ACCENT LINE
   Thin hairline of warm gold inset into architecture
   Cartier / luxury watch detail
   ───────────────────────────────────────────── */
function GoldAccent({
  position,
  scale = [0.02, 0.02, 30],
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={scale} />
      <meshPhysicalMaterial
        color="#b8960c"
        metalness={1}
        roughness={0.15}
        emissive="#d4a017"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   THE CINEMATIC SCENE
   A luxury sanctuary: architecture, water, light, silence.
   ═══════════════════════════════════════════════ */
export function CinematicScene() {
  const scroll = useScroll();
  const cameraRig = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!cameraRig.current) return;

    const offset = scroll.offset;
    const time = state.clock.getElapsedTime();

    // ── CAMERA: Slow, ground-level cinematic drift ──
    // Like a cinematographer discovering a forbidden sanctuary
    // Starting position: slightly off-center, low to the water
    const scrollZ = THREE.MathUtils.lerp(15, -40, offset);
    const scrollX = Math.sin(offset * Math.PI * 0.5) * 3;
    const scrollY = THREE.MathUtils.lerp(1.2, 2.5, offset);

    // Breathing micro-drift (handheld feel)
    const breathX = Math.sin(time * 0.15) * 0.08;
    const breathY = Math.cos(time * 0.12) * 0.04;

    cameraRig.current.position.x = scrollX + breathX;
    cameraRig.current.position.y = scrollY + breathY;
    cameraRig.current.position.z = scrollZ;

    // Subtle mouse parallax (spatial tension)
    const mx = state.pointer.x * 0.3;
    const my = state.pointer.y * 0.15;
    cameraRig.current.rotation.y = mx * 0.03;
    cameraRig.current.rotation.x = -my * 0.02 - 0.05;
  });

  return (
    <group ref={cameraRig}>
      {/* ══════════════════════════════════════════
          LIGHTING: Divine, restrained, architectural
          ══════════════════════════════════════════ */}

      {/* Near-zero ambient — the world lives in darkness */}
      <ambientLight intensity={0.02} color="#1a1a2e" />

      {/* Primary: Cold platinum shaft from upper-left (the "divine" light) */}
      <spotLight
        position={[-8, 18, -5]}
        angle={0.12}
        penumbra={1}
        intensity={8}
        color="#d1cfc8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Secondary: Warm gold accent from deep right (jewellery warmth) */}
      <spotLight
        position={[12, 14, -20]}
        angle={0.15}
        penumbra={1}
        intensity={4}
        color="#e8c87a"
        castShadow
      />

      {/* Distant fill: Faint cool blue rim from behind (depth separation) */}
      <directionalLight
        position={[0, 5, -50]}
        intensity={0.3}
        color="#4a5568"
      />

      {/* Very subtle warm uplight reflected from the water */}
      <pointLight position={[0, -1, 0]} intensity={0.1} color="#c9b896" distance={20} />

      {/* ══════════════════════════════════════════
          THE WATER FLOOR: Infinite, mirror-black, perfectly still
          ══════════════════════════════════════════ */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <MeshReflectorMaterial
          blur={[400, 200]}
          resolution={1024}
          mixBlur={1}
          mixStrength={100}
          roughness={0.05}
          depthScale={1.5}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.5}
          color="#030303"
          metalness={0.8}
          mirror={0.9}
        />
      </mesh>

      {/* ══════════════════════════════════════════
          THE ARCHITECTURE: Massive, asymmetric, sacred
          Hybrid obsidian/titanium — ancient AND futuristic
          ══════════════════════════════════════════ */}

      {/* ── LEFT COLONNADE: Staggered massive pillars fading into fog ── */}
      <ArchWall position={[-10, 7, 5]} scale={[1.5, 14, 4]} color="#0a0a0a" roughness={0.5} metalness={0.6} />
      <ArchWall position={[-10, 7, -8]} scale={[1.5, 14, 3]} color="#080808" roughness={0.4} metalness={0.7} />
      <ArchWall position={[-10, 7, -22]} scale={[1.5, 14, 5]} color="#060606" roughness={0.3} metalness={0.8} />
      <ArchWall position={[-10, 7, -38]} scale={[1.5, 14, 3.5]} color="#050505" roughness={0.25} metalness={0.85} />

      {/* ── RIGHT COLONNADE: Offset, different rhythm ── */}
      <ArchWall position={[9, 8, 2]} scale={[2, 16, 3.5]} color="#0b0b0b" roughness={0.45} metalness={0.65} />
      <ArchWall position={[9, 8, -12]} scale={[2, 16, 5]} color="#090909" roughness={0.35} metalness={0.75} />
      <ArchWall position={[9, 8, -30]} scale={[2, 16, 4]} color="#070707" roughness={0.3} metalness={0.8} />

      {/* ── CEILING SLAB: Heavy overhang creating shadow and scale ── */}
      <ArchWall position={[0, 15, -15]} scale={[25, 1.5, 80]} color="#060606" roughness={0.6} metalness={0.5} />

      {/* ── DISTANT REAR WALL: The "end" of the sanctuary, barely visible ── */}
      <ArchWall position={[0, 8, -55]} scale={[30, 20, 2]} color="#040404" roughness={0.7} metalness={0.3} />

      {/* ── FLOATING OFFSET SLAB: Asymmetric tension, not centered ── */}
      <ArchWall position={[-4, 10, -25]} scale={[8, 0.8, 12]} color="#0a0a0a" roughness={0.2} metalness={0.9} />

      {/* ── LOW STEP/PLINTH: Ground-level architectural detail ── */}
      <ArchWall position={[0, 0.15, -15]} scale={[14, 0.3, 50]} color="#0c0c0c" roughness={0.1} metalness={0.95} />

      {/* ══════════════════════════════════════════
          GOLD ACCENT LINES: Cartier-level luxury detail
          Thin hairlines inset into the architecture
          ══════════════════════════════════════════ */}

      {/* Gold inlay on left colonnade */}
      <GoldAccent position={[-9.2, 1.5, -8]} scale={[0.02, 0.02, 35]} />
      <GoldAccent position={[-9.2, 3, -8]} scale={[0.015, 0.015, 35]} />

      {/* Gold inlay on right colonnade */}
      <GoldAccent position={[8, 1.5, -12]} scale={[0.02, 0.02, 30]} />

      {/* Gold line on the floating slab edge */}
      <GoldAccent position={[-4, 9.6, -19.5]} scale={[8, 0.015, 0.015]} rotation={[0, 0, 0]} />

      {/* Ground level gold channel in the polished floor plinth */}
      <GoldAccent position={[0, 0.32, -15]} scale={[0.01, 0.01, 50]} />

      {/* ══════════════════════════════════════════
          VOLUMETRIC LIGHT SHAFTS
          Divine, restrained, slicing through the fog
          ══════════════════════════════════════════ */}

      {/* Primary divine shaft — the hero light */}
      <LightShaft position={[-3, 8, -10]} rotation={[0, 0, 0.15]} scale={[0.2, 18, 50]} opacity={0.025} color="#e8dcc8" />

      {/* Secondary warm gold shaft from the right */}
      <LightShaft position={[5, 9, -25]} rotation={[0, 0, -0.1]} scale={[0.15, 18, 40]} opacity={0.015} color="#d4a54a" />

      {/* Very faint distant shaft — depth cue */}
      <LightShaft position={[0, 10, -45]} rotation={[0, 0, 0]} scale={[0.3, 18, 20]} opacity={0.01} color="#8a9bb5" />

      {/* ══════════════════════════════════════════
          ATMOSPHERIC FOG LAYERS
          Layered depth — the environment dissolves into mystery
          ══════════════════════════════════════════ */}

      {/* Near fog — subtle, grounds the camera */}
      <FogLayer position={[0, 4, 8]} scale={[60, 15]} opacity={0.03} color="#0a0d14" />

      {/* Mid fog — the architectural boundary */}
      <FogLayer position={[0, 5, -20]} scale={[60, 18]} opacity={0.06} color="#080b12" />

      {/* Far fog — swallows the distant wall */}
      <FogLayer position={[0, 6, -40]} scale={[60, 20]} opacity={0.12} color="#060910" />

      {/* Deep fog — the void beyond */}
      <FogLayer position={[0, 7, -52]} scale={[60, 22]} opacity={0.2} color="#030508" />

      {/* ══════════════════════════════════════════
          ATMOSPHERIC DUST
          Suspended particles catching the light shafts
          ══════════════════════════════════════════ */}
      <DustParticles count={400} />
    </group>
  );
}
