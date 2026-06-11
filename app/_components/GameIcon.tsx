// Los emojis se retiran de las superficies de juego (directiva §4.9): un juego
// tiene sprites. Glifos 24×24, stroke 2, esquinas geométricas — el lenguaje del
// mark (dos discos). Color vía currentColor; `filled` = variante activa.
// Server-safe: SVG inline puro, sin estado.

export type GameIconName =
  | "golpe"
  | "hielo"
  | "escudo"
  | "chispa"
  | "eslabones"
  | "municion"
  | "rayo"
  | "nivel"
  | "duelo"
  | "premio"
  | "candado"
  | "corona"
  | "tabla"
  | "perfil"
  | "pin";

const PATHS: Record<GameIconName, (filled: boolean) => React.ReactNode> = {
  // impacto: rombo central + ticks radiales a 90°
  golpe: (f) => (
    <>
      <path d="M12 8l4 4-4 4-4-4z" fill={f ? "currentColor" : "none"} />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  // asterisco de hielo (tres ejes)
  hielo: () => <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />,
  escudo: (f) => (
    <path
      d="M12 3l7 2.8v6c0 4.4-2.9 7.4-7 9.2-4.1-1.8-7-4.8-7-9.2v-6z"
      fill={f ? "currentColor" : "none"}
    />
  ),
  // chispa de boost: estrella de 4 puntas
  chispa: (f) => (
    <path
      d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"
      fill={f ? "currentColor" : "none"}
    />
  ),
  // dos eslabones — la racha es una cadena, no una llama
  eslabones: () => (
    <>
      <path d="M9.5 14.5l5-5" />
      <path d="M13 7l1.5-1.5a3.5 3.5 0 015 5L18 12" />
      <path d="M11 17l-1.5 1.5a3.5 3.5 0 01-5-5L6 12" />
    </>
  ),
  // munición: disco cargado
  municion: (f) => (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3" fill={f ? "currentColor" : "none"} />
    </>
  ),
  rayo: (f) => (
    <path d="M13 2L4.5 14H11l-1 8 8.5-12H12z" fill={f ? "currentColor" : "none"} />
  ),
  // nivel: doble chevrón ascendente
  nivel: () => <path d="M5 13.5L12 7l7 6.5M5 19l7-6.5 7 6.5" />,
  // duelo: los dos discos del mark, enfrentados
  duelo: (f) => (
    <>
      <circle cx="7" cy="12" r="4.2" fill={f ? "currentColor" : "none"} />
      <circle cx="17" cy="12" r="4.2" fill={f ? "currentColor" : "none"} />
    </>
  ),
  // premio: caja con listón
  premio: (f) => (
    <>
      <path d="M4 8h16v4H4z" fill={f ? "currentColor" : "none"} />
      <path d="M5.5 12v8.5h13V12" />
      <path d="M12 8v12.5" />
      <path d="M12 8c-1.5-3-3-4.5-4.7-4.5C6 3.5 5.2 4.3 5.2 5.4 5.2 7 7 8 9 8zM12 8c1.5-3 3-4.5 4.7-4.5 1.3 0 2.1.8 2.1 1.9C18.8 7 17 8 15 8z" />
    </>
  ),
  candado: (f) => (
    <>
      <rect x="5" y="11" width="14" height="9.5" rx="2" fill={f ? "currentColor" : "none"} />
      <path d="M8 11V7.5a4 4 0 018 0V11" />
    </>
  ),
  corona: (f) => (
    <path
      d="M4 18.5L3 8l5.2 4L12 5l3.8 7L21 8l-1 10.5z"
      fill={f ? "currentColor" : "none"}
    />
  ),
  // tabla: podio de tres barras
  tabla: (f) => (
    <>
      <path d="M9.5 20V5.5h5V20" fill={f ? "currentColor" : "none"} />
      <path d="M3.5 20v-8h6v8" fill={f ? "currentColor" : "none"} />
      <path d="M14.5 20v-5.5h6V20" fill={f ? "currentColor" : "none"} />
      <path d="M2 20h20" />
    </>
  ),
  perfil: (f) => (
    <>
      <circle cx="12" cy="8" r="4" fill={f ? "currentColor" : "none"} />
      <path d="M4.5 20.5c.8-3.7 3.9-5.5 7.5-5.5s6.7 1.8 7.5 5.5" />
    </>
  ),
  // sello del lugar: pin geométrico
  pin: (f) => (
    <>
      <path
        d="M12 21.5S5.5 15.8 5.5 10.5a6.5 6.5 0 1113 0C18.5 15.8 12 21.5 12 21.5z"
        fill={f ? "currentColor" : "none"}
      />
      <circle cx="12" cy="10.5" r="2.2" fill={f ? "var(--c-paper, #fff)" : "none"} />
    </>
  ),
};

export default function GameIcon({
  name,
  size = 24,
  filled = false,
  className,
}: {
  name: GameIconName;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      className={className}
    >
      {PATHS[name](filled)}
    </svg>
  );
}
