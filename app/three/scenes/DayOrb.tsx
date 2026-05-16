"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * DayOrb — esfera pequeña que representa un día.
 * Color cambia según foco/estado:
 *  - rest: gris oscuro
 *  - training (separated): cyan o magenta según perfil
 *  - training (together): lime
 *  - today: pulse intensifica
 */
export default function DayOrb({
  state = "rest",
  isToday = false,
  who = "mike",
}: {
  state?: "rest" | "solo" | "together";
  isToday?: boolean;
  who?: "mike" | "andy";
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const color =
    state === "together" ? "#c8f135"
    : state === "solo"   ? (who === "mike" ? "#6bf5ff" : "#ff6b9d")
    : "#44444c";

  useFrame((state) => {
    if (!meshRef.current) return;
    if (isToday) {
      const t = state.clock.elapsedTime;
      meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
    }
    meshRef.current.rotation.y += 0.005;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={state === "rest" ? 0.05 : isToday ? 0.7 : 0.4}
        metalness={0.4}
        roughness={0.3}
      />
    </mesh>
  );
}
