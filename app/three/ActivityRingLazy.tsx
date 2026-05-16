"use client";

import dynamic from "next/dynamic";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });
const ActivityRing = dynamic(() => import("./scenes/ActivityRing"), { ssr: false });

export default function ActivityRingLazy({
  progress,
  color,
  height = "320px",
}: {
  progress: number;
  color: string;
  height?: string;
}) {
  return (
    <SceneCanvas height={height} cameraPosition={[0, 0.4, 5]} cameraFov={34}>
      <ActivityRing progress={progress} color={color} size={1.5} />
    </SceneCanvas>
  );
}
