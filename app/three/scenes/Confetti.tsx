"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Confetti — particle burst que sale del centro hacia afuera.
 * Live por 2-3 segundos, luego termina y desmonta.
 * Pensado para milestones (pair streak 7/14/30 días).
 */
export default function Confetti({
  count = 80,
  trigger = false,
  duration = 2.4,
}: {
  count?: number;
  trigger?: boolean;
  duration?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const startTimeRef = useRef<number | null>(null);

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [0.78, 0.94, 0.21], // lime
      [0.42, 0.96, 1.0],  // cyan
      [1.0, 0.42, 0.62],  // magenta
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      // Distribución esférica uniforme
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1.4 + Math.random() * 1.6;
      vel[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 0.6;
      vel[i * 3 + 2] = Math.cos(phi) * speed;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3 + 0] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return { positions: pos, velocities: vel, colors: col };
  }, [count]);

  useFrame((state, dt) => {
    if (!pointsRef.current || !trigger) return;
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    if (elapsed > duration) return;

    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    const gravity = -2.4;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] += velocities[i * 3 + 0] * dt;
      pos[i * 3 + 1] += velocities[i * 3 + 1] * dt + 0.5 * gravity * dt * dt;
      pos[i * 3 + 2] += velocities[i * 3 + 2] * dt;
      velocities[i * 3 + 1] += gravity * dt;
    }
    geo.attributes.position.needsUpdate = true;

    // Fade out via opacity en material
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    const t = elapsed / duration;
    mat.opacity = Math.max(0, 1 - t * t);
  });

  if (!trigger) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
