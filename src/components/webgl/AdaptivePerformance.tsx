"use client";

import { useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  setPerformanceMode: (mode: 'ultra' | 'safe') => void;
}

export function AdaptivePerformance({ children, setPerformanceMode }: Props) {
  const { gl } = useThree();
  
  return (
    <PerformanceMonitor 
      onIncline={() => {
        gl.setPixelRatio(Math.min(2, window.devicePixelRatio));
        setPerformanceMode('ultra');
      }} 
      onDecline={() => {
        // Drop pixel ratio to 1 for low-end devices / FPS drops
        gl.setPixelRatio(1);
        setPerformanceMode('safe');
      }}
      // Check every 2 seconds
      bounds={() => [40, 60]} 
    >
      {children}
    </PerformanceMonitor>
  );
}
