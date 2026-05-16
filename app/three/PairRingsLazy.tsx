"use client";

import dynamic from "next/dynamic";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });
const PairRings = dynamic(() => import("./scenes/PairRings"), { ssr: false });

/**
 * Pair rings 3D — client-only lazy wrapper.
 *
 * R3F's <Canvas> requiere DOM; SSR crashea. Este Client Component permite
 * usar dynamic(ssr:false), patrón no permitido directo desde Server
 * Components en Next 15.
 */
export default function PairRingsLazy({
  mikeProgress,
  andyProgress,
  pairStreak,
  height = "380px",
}: {
  mikeProgress: number;
  andyProgress: number;
  pairStreak: number;
  height?: string;
}) {
  return (
    <SceneCanvas height={height} cameraPosition={[0, 0.2, 5.5]} cameraFov={32}>
      <PairRings
        mikeProgress={mikeProgress}
        andyProgress={andyProgress}
        pairStreak={pairStreak}
      />
    </SceneCanvas>
  );
}
