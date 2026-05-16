"use client";

import dynamic from "next/dynamic";

const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });
const IridescentOrb = dynamic(() => import("./scenes/IridescentOrb"), { ssr: false });

/**
 * IridescentOrb hero — el orbe líquido refractivo del hero principal.
 *
 * Usa el shader iridiscente con la paleta de roles dovo (cyan/magenta/lime).
 * Reacciona al cursor con leve rotation. Auto-rotate cuando idle.
 */
export default function IridescentOrbLazy({
  height = "440px",
  size = 1.5,
}: {
  height?: string;
  size?: number;
}) {
  return (
    <SceneCanvas
      height={height}
      cameraPosition={[0, 0, 4.6]}
      cameraFov={32}
      interactive
    >
      <IridescentOrb size={size} />
    </SceneCanvas>
  );
}
