"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Trophy — geometría procedural según `tier` del premio:
 * - easy:    octahedron pequeño
 * - mid:     icosahedron mediano
 * - big:     dodecahedron + halo
 * - epic:    cono apilado tipo trofeo
 * - legendary: trofeo con base cuadrada + colmena de aros
 *
 * Interactiva: drag para rotar. Auto-rotate cuando idle.
 */
export type TrophyTier = "easy" | "mid" | "big" | "epic" | "legendary";

const TIER_COLORS: Record<TrophyTier, string> = {
  easy:      "#7fb069",
  mid:       "#6bf5ff",
  big:       "#ff6b9d",
  epic:      "#c8f135",
  legendary: "#fbbf24",
};

export default function Trophy({
  tier = "easy",
  size = 1,
}: {
  tier?: TrophyTier;
  size?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const color = TIER_COLORS[tier];

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const targetSpeed = hovered ? 1.4 : 0.5;
    groupRef.current.rotation.y += dt * targetSpeed;
  });

  return (
    <group
      ref={groupRef}
      scale={size}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {tier === "easy" && (
        <mesh>
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      )}
      {tier === "mid" && (
        <mesh>
          <icosahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
            metalness={0.55}
            roughness={0.28}
          />
        </mesh>
      )}
      {tier === "big" && (
        <>
          <mesh>
            <dodecahedronGeometry args={[0.95, 0]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.45}
              metalness={0.6}
              roughness={0.25}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.3, 0.03, 8, 64]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
          </mesh>
        </>
      )}
      {tier === "epic" && (
        <group>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.7, 0.9, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              metalness={0.6}
              roughness={0.22}
            />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.4, 0.6, 0.4, 32]} />
            <meshStandardMaterial color="#1d1d25" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.55, 0]}>
            <boxGeometry args={[1, 0.12, 1]} />
            <meshStandardMaterial color="#0a0a0c" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}
      {tier === "legendary" && (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, i * 0.35 - 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.55 - i * 0.12, 0.05, 12, 64]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.55 + i * 0.15}
                metalness={0.5}
                roughness={0.2}
              />
            </mesh>
          ))}
          <mesh position={[0, -0.6, 0]}>
            <boxGeometry args={[1.1, 0.15, 1.1]} />
            <meshStandardMaterial color="#0a0a0c" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}
    </group>
  );
}
