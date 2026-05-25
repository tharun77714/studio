"use client";

import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';

export function CameraRig() {
  const { camera, pointer } = useThree();
  const target = new THREE.Vector3();
  const lastScrollY = useRef(0);
  const scrollVelocity = useRef(0);

  useFrame((state, delta) => {
    // 1. Scroll tracking with Velocity Intelligence
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
    
    // Calculate scroll velocity for reactive physics
    const currentVelocity = scrollY - lastScrollY.current;
    scrollVelocity.current = THREE.MathUtils.lerp(scrollVelocity.current, currentVelocity, 0.1);
    lastScrollY.current = scrollY;

    // Cinematic scroll zoom & move (slow orbital transition)
    // As user scrolls, camera moves down and zooms in slightly
    const targetZ = 6 - (scrollProgress * 2) + (scrollVelocity.current * 0.005);
    const targetY = -(scrollProgress * 3);

    // 2. Mouse reactive parallax (Reactive Light Physics / Camera shift)
    // Velocity subtly affects how much the mouse influences the camera
    const mouseInfluence = 0.5 + (Math.abs(scrollVelocity.current) * 0.001);
    target.set(
      pointer.x * mouseInfluence,
      targetY + pointer.y * mouseInfluence,
      targetZ
    );

    // 3. Smooth damp the camera position for Apple/Tesla slow inertia
    // Using an extremely confident, slow easing (delta * 1.5)
    camera.position.lerp(target, delta * 1.5); 
    
    // Look at center, modified slightly by pointer and scroll for subtle perspective shifts
    const lookAtTarget = new THREE.Vector3(
      pointer.x * 0.1, 
      targetY + pointer.y * 0.1, 
      0
    );
    
    // Manually slerp the quaternion for buttery smooth camera rotation
    const dummyCamera = camera.clone();
    dummyCamera.position.copy(camera.position);
    dummyCamera.lookAt(lookAtTarget);
    camera.quaternion.slerp(dummyCamera.quaternion, delta * 2.0);
  });

  return null;
}
