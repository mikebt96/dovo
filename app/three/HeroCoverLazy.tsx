"use client";

import dynamic from "next/dynamic";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });
const HeroCover = dynamic(() => import("./scenes/HeroCover"), { ssr: false });

/**
 * Home cover 3D — client-only lazy wrapper.
 *
 * Mismo patrón que los otros *Lazy: envuelve dynamic(ssr:false) en un
 * Client Component para que un Server Component (la home) lo pueda
 * renderizar sin crashear durante SSR de R3F.
 */
export default function HeroCoverLazy({
  height = "380px",
}: {
  height?: string;
}) {
  return (
    <SceneCanvas height={height} cameraPosition={[0, 0.2, 5]} cameraFov={32}>
      <HeroCover />
    </SceneCanvas>
  );
}
