"use client";

import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";

const Blob = dynamic(() => import("./scenes/Blob"), { ssr: false });

/**
 * BlobHeroLazy — Canvas full-bleed para hero principal.
 *
 * Va detrás del contenido (z-0 absolute inset-0). Usa Environment preset
 * "studio" para lighting realista sin tener que descargar HDR externos.
 *
 * `pointer-events-auto` permite hover sobre el blob (intensifica displacement).
 */
export default function BlobHeroLazy() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 8] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Blob />
        <Environment preset="studio" environmentIntensity={0.6} />
      </Canvas>
    </div>
  );
}
