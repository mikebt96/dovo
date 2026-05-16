"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * WeightPlate — disco olímpico flotando, rotando lento.
 * Hero del día de entreno. La "carga" (sutil) puede reflejarse en el grosor
 * del centro y la intensidad del lime emissive.
 */
export default function WeightPlate({
  weightKg = 20,
  accent = "#c8f135",
}: {
  weightKg?: number;
  accent?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += dt * 0.4;
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.6) * 0.18 + Math.PI * 0.18;
    groupRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
  });

  // Tamaño del plate "sentido": pesos más grandes → disco un poco más grueso
  const thickness = 0.18 + Math.min(0.18, weightKg / 100);

  return (
    <group ref={groupRef}>
      {/* Disco exterior */}
      <mesh>
        <cylinderGeometry args={[1.5, 1.5, thickness, 64]} />
        <meshStandardMaterial
          color="#0a0a0c"
          metalness={0.85}
          roughness={0.35}
          envMapIntensity={1}
        />
      </mesh>
      {/* Borde lime */}
      <mesh>
        <torusGeometry args={[1.49, 0.04, 12, 64]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.7}
          metalness={0.4}
          roughness={0.2}
        />
      </mesh>
      {/* Hueco central (eje) */}
      <mesh>
        <cylinderGeometry args={[0.27, 0.27, thickness + 0.02, 32]} />
        <meshStandardMaterial
          color="#16161c"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {/* Aro interior plata */}
      <mesh>
        <torusGeometry args={[0.42, 0.025, 8, 48]} />
        <meshStandardMaterial
          color="#b5b5bd"
          metalness={1}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}
