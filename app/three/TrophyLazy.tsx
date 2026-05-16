"use client";

import dynamic from "next/dynamic";
import type { TrophyTier } from "./scenes/Trophy";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });
const Trophy = dynamic(() => import("./scenes/Trophy"), { ssr: false });

export default function TrophyLazy({
  tier,
  height = "180px",
}: {
  tier: TrophyTier;
  height?: string;
}) {
  return (
    <SceneCanvas height={height} cameraPosition={[0, 0.1, 3.5]} cameraFov={36} interactive>
      <Trophy tier={tier} size={1} />
    </SceneCanvas>
  );
}
