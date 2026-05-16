"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { useDeviceCapability } from "./hooks/useDeviceCapability";

/**
 * Wrapper compartido para escenas hero/feature.
 * Cada página importa este componente y mete los meshes hijos.
 *
 * Defaults razonables:
 * - DPR adaptativo por tier
 * - Camera perspective 35deg
 * - Ambient + directional + env preset
 * - Suspense fallback transparente (el contenido 2D sigue visible debajo)
 */
export default function SceneCanvas({
  children,
  height = "min(60vh, 520px)",
  cameraPosition = [0, 0, 4],
  cameraFov = 35,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  height?: string | number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  className?: string;
  interactive?: boolean;
}) {
  const tier = useDeviceCapability();
  const dpr: [number, number] = tier === "high" ? [1, 2] : tier === "mid" ? [1, 1.5] : [1, 1];

  return (
    <div
      className={`scene-stage ${className}`}
      style={{
        height,
        width: "100%",
        pointerEvents: interactive ? "auto" : "none",
      }}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: cameraPosition, fov: cameraFov, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-4, -2, 3]} intensity={0.4} color="#6bf5ff" />
        <directionalLight position={[4, -3, -2]} intensity={0.4} color="#ff6b9d" />
        <Suspense fallback={null}>
          {tier !== "low" && <Environment preset="city" />}
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}
