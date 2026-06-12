// Única fuente JS de los colores fijos del panel de juego (.card-game).
// Espejo de app/globals.css :root (--mode-gold / --game-racha / --game-coop /
// --game-muted): canvas-confetti y otros consumidores JS no resuelven var()
// de CSS — necesitan hex literales. Si cambias un valor aquí, cámbialo
// también en globals.css (y viceversa).
export const GAME_COLORS = {
  gold: "#f0c75a",
  racha: "#ffb454",
  coop: "#4adfb2",
  muted: "#9aa0ae",
} as const;
