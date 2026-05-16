"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * PairRings — dos torus entrelazados (cyan = Mike, magenta = Andy).
 * Cuando ambos cumplen, se entrelazan más cerca y un anillo lima sutil
 * aparece sobreimpreso. Hero de /duo y /juntos.
 */
export default function PairRings({
  mikeProgress = 0.5,
  andyProgress = 0.5,
  pairStreak = 0,
}: {
  mikeProgress?: number;
  andyProgress?: number;
  pairStreak?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const limeRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += dt * 0.16;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.12;
    // El anillo lime late con la racha del dúo (pulse intensifica con días)
    if (limeRef.current) {
      const mat = limeRef.current.material as THREE.MeshStandardMaterial;
      const pulse = 0.55 + Math.sin(state.clock.elapsedTime * 1.6) * 0.15;
      mat.emissiveIntensity = pulse * Math.min(1, pairStreak / 7 + 0.2);
    }
  });

  const ringRadius = 1.4;
  const tubeRadius = ringRadius * 0.065;
  const segments = 96;

  // Floor visual: progress=0 mostraba arc casi vacío ("ring roto").
  // Forzamos un mínimo de 8% del círculo (~29°) para que SIEMPRE se
  // lea como anillo cyan/magenta presente, incluso antes del primer día.
  const MIN_VISIBLE_ARC = 0.08;
  const mikeArc = Math.PI * 2 * Math.max(MIN_VISIBLE_ARC, Math.min(1, mikeProgress));
  const andyArc = Math.PI * 2 * Math.max(MIN_VISIBLE_ARC, Math.min(1, andyProgress));

  return (
    <group ref={groupRef}>
      {/* Mike — cyan */}
      <group position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI * 0.05]}>
        <mesh>
          <torusGeometry args={[ringRadius, tubeRadius * 0.7, 12, segments]} />
          <meshStandardMaterial color="#1d1d25" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[ringRadius, tubeRadius, 24, segments, mikeArc]} />
          <meshStandardMaterial
            color="#6bf5ff"
            emissive="#6bf5ff"
            emissiveIntensity={0.6}
            metalness={0.4}
            roughness={0.25}
            envMapIntensity={1.3}
          />
        </mesh>
      </group>

      {/* Andy — magenta */}
      <group position={[0.35, 0, 0]} rotation={[Math.PI / 2.2, 0, -Math.PI * 0.05]}>
        <mesh>
          <torusGeometry args={[ringRadius, tubeRadius * 0.7, 12, segments]} />
          <meshStandardMaterial color="#1d1d25" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[ringRadius, tubeRadius, 24, segments, andyArc]} />
          <meshStandardMaterial
            color="#ff6b9d"
            emissive="#ff6b9d"
            emissiveIntensity={0.55}
            metalness={0.4}
            roughness={0.25}
            envMapIntensity={1.3}
          />
        </mesh>
      </group>

      {/* Pair overprint — lime ring que pulsa con racha compartida */}
      {pairStreak > 0 && (
        <mesh ref={limeRef} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
          <torusGeometry args={[ringRadius * 0.55, tubeRadius * 0.5, 24, 96]} />
          <meshStandardMaterial
            color="#c8f135"
            emissive="#c8f135"
            emissiveIntensity={0.4}
            metalness={0.3}
            roughness={0.2}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}
    </group>
  );
}
