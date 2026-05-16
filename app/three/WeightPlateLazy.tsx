"use client";

import dynamic from "next/dynamic";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });
const WeightPlate = dynamic(() => import("./scenes/WeightPlate"), { ssr: false });

export default function WeightPlateLazy({
  weightKg,
  height = "320px",
}: {
  weightKg: number;
  height?: string;
}) {
  return (
    <SceneCanvas height={height} cameraPosition={[0, 0.2, 4]} cameraFov={36}>
      <WeightPlate weightKg={weightKg} accent="#c8f135" />
    </SceneCanvas>
  );
}
