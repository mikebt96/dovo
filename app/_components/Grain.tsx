// Grano premium app-wide (DESIGN.md §7: feTurbulence fijo, ~4% opacidad, el "tell"
// de impresión). pointer-events-none → no intercepta clicks. mix-blend-soft-light
// para integrarse en superficies claras y oscuras sin ensuciar el texto.
export default function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.045] mix-blend-soft-light motion-reduce:hidden"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
