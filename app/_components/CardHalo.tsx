// Halo radial de los paneles de juego (F23·G12) — consolida las 8 copias
// inline (CharacterCard, DuoChampion, recompensas, nutrición y las 4
// ceremonias). Presentacional puro, sin hooks: usable en server y client.
// position fija el tamaño: corner = esquina sup-der de cards; center = halo
// de ceremonia centrado arriba.
export default function CardHalo({
  position = "corner",
  color = "var(--c-signal)",
  opacity = 0.4,
}: {
  position?: "corner" | "center";
  color?: string;
  opacity?: number;
}) {
  const posClasses =
    position === "corner"
      ? "-top-24 -right-16 w-64 h-64"
      : "-top-20 left-1/2 -translate-x-1/2 w-72 h-72";
  return (
    <div
      aria-hidden
      className={"pointer-events-none absolute rounded-full blur-3xl " + posClasses}
      style={{
        opacity,
        background: `radial-gradient(circle, color-mix(in srgb, ${color} 55%, transparent), transparent 70%)`,
      }}
    />
  );
}
