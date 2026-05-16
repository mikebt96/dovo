"use client";

import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { useDeviceCapability } from "./hooks/useDeviceCapability";
import Aurora from "./Aurora";

/**
 * Background canvas global — montado por app/layout.tsx una sola vez.
 * Persiste entre navegaciones de App Router porque vive en el body.
 *
 * Si `prefers-reduced-motion`, no monta nada (el CSS fallback en globals.css
 * ya dibuja un gradiente radial estático). Si tier bajo, baja DPR.
 */
export default function SceneBackground() {
  const reduced = useReducedMotion();
  const tier = useDeviceCapability();

  if (reduced) return null;

  const dpr = tier === "high" ? [1, 2] as [number, number]
            : tier === "mid"  ? [1, 1.5] as [number, number]
            : [1, 1] as [number, number];

  return (
    <div
      className="scene-stage-bg"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Canvas
        dpr={dpr}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        frameloop={tier === "low" ? "demand" : "always"}
        camera={{ position: [0, 0, 1], near: 0.01, far: 10 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <Aurora intensity={tier === "high" ? 1 : tier === "mid" ? 0.85 : 0.6} />
      </Canvas>
    </div>
  );
}
