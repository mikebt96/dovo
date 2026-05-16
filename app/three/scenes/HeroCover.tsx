"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * HeroCover — escena del home selector.
 * Dos orbs (cyan = Mike, magenta = Andy) orbitando un núcleo lime.
 * El núcleo brilla cuando ambos orbs están cerca → metáfora de pareja.
 */
export default function HeroCover() {
  const groupRef = useRef<THREE.Group>(null);
  const mikeRef = useRef<THREE.Mesh>(null);
  const andyRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += dt * 0.12;
    const t = state.clock.elapsedTime;
    const r = 1.6;
    if (mikeRef.current) {
      mikeRef.current.position.x = Math.cos(t * 0.5) * r;
      mikeRef.current.position.z = Math.sin(t * 0.5) * r;
      mikeRef.current.position.y = Math.sin(t * 0.8) * 0.3;
    }
    if (andyRef.current) {
      andyRef.current.position.x = Math.cos(t * 0.5 + Math.PI) * r;
      andyRef.current.position.z = Math.sin(t * 0.5 + Math.PI) * r;
      andyRef.current.position.y = Math.cos(t * 0.8) * 0.3;
    }
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.8 + Math.sin(t * 1.5) * 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Núcleo lime */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial
          color="#c8f135"
          emissive="#c8f135"
          emissiveIntensity={0.9}
          metalness={0.3}
          roughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Mike orb — cyan */}
      <mesh ref={mikeRef}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial
          color="#6bf5ff"
          emissive="#6bf5ff"
          emissiveIntensity={0.55}
          metalness={0.4}
          roughness={0.22}
        />
      </mesh>
      {/* Andy orb — magenta */}
      <mesh ref={andyRef}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial
          color="#ff6b9d"
          emissive="#ff6b9d"
          emissiveIntensity={0.55}
          metalness={0.4}
          roughness={0.22}
        />
      </mesh>
      {/* Orbit hint ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.008, 8, 96]} />
        <meshBasicMaterial color="#74747e" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
