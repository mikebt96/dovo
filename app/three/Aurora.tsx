"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { auroraFragment, auroraVertex } from "./materials/auroraShader";
import { useDeviceCapability } from "./hooks/useDeviceCapability";

/**
 * Aurora — plane fullscreen con shader que mueve 3 blobs de gradient
 * (cyan / magenta / lime) lentamente. Es el bg principal de la app.
 *
 * Pensado para correr a baja intensidad para no robar atención del contenido.
 * En `low` tier deshabilita el ruido secundario.
 */
export default function Aurora({ intensity = 1 }: { intensity?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const tier = useDeviceCapability();
  const fidelity = tier === "high" ? 1 : tier === "mid" ? 0.5 : 0;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uColorMike: { value: new THREE.Color("#6bf5ff").multiplyScalar(0.35) },
      uColorAndy: { value: new THREE.Color("#ff6b9d").multiplyScalar(0.32) },
      uColorBoth: { value: new THREE.Color("#c8f135").multiplyScalar(0.18) },
      uIntensity: { value: intensity },
      uFidelity: { value: fidelity },
    }),
    [size.width, size.height, intensity, fidelity]
  );

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={auroraVertex}
        fragmentShader={auroraFragment}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
