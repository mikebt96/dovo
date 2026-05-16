"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * ActivityRing — torus 3D que se llena con `progress` (0..1).
 * Usado en el dashboard hero. Apple Activity Ring vibe pero 3D real
 * con metalness sutil + emissive lime al completar.
 */
export default function ActivityRing({
  progress = 0.5,
  color = "#c8f135",
  size = 1.6,
}: {
  progress?: number;
  color?: string;
  size?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const fillRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.18;
    }
  });

  // arc length: el torus "lleno" cubre `progress` del círculo completo.
  // Lo logramos rotando + clip via arc segment torus.
  const segments = 96;
  const arc = Math.PI * 2 * Math.max(0.001, Math.min(1, progress));

  return (
    <group ref={groupRef} rotation={[Math.PI * 0.18, 0, 0]}>
      {/* Empty ring */}
      <mesh>
        <torusGeometry args={[size, size * 0.07, 16, segments]} />
        <meshStandardMaterial
          color="#1d1d25"
          metalness={0.6}
          roughness={0.4}
          envMapIntensity={0.6}
        />
      </mesh>
      {/* Filled arc */}
      <mesh ref={fillRef} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[size, size * 0.085, 24, segments, arc]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          metalness={0.4}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>
    </group>
  );
}
