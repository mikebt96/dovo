"use client";

import dynamic from "next/dynamic";

const SceneBackground = dynamic(
  () => import("@/app/three/SceneBackground"),
  { ssr: false }
);

export default function BackgroundWrapper() {
  return <SceneBackground />;
}
