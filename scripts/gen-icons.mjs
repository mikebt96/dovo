// Genera los PNG del manifest desde app/icon.svg (sharp viene con Next).
//   node scripts/gen-icons.mjs
// Salidas: public/icons/icon-192.png, icon-512.png, maskable-512.png (con safe-zone),
// public/apple-touch-icon.png (180, fondo papel — iOS no soporta transparencia bien).
import { mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync(new URL("../app/icon.svg", import.meta.url));
mkdirSync(new URL("../public/icons", import.meta.url), { recursive: true });

const out = (p) => new URL(`../public/${p}`, import.meta.url).pathname;

// Iconos "any": el SVG tal cual, raster.
await sharp(svg).resize(192, 192).png().toFile(out("icons/icon-192.png"));
await sharp(svg).resize(512, 512).png().toFile(out("icons/icon-512.png"));

// Maskable: el glifo al 70% centrado sobre fondo black-violet (safe zone de Android).
const glyph = await sharp(svg).resize(358, 358).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#07060d" },
})
  .composite([{ input: glyph, gravity: "center" }])
  .png()
  .toFile(out("icons/maskable-512.png"));

// apple-touch-icon: 180px, glifo sobre papel (iOS redondea esquinas solo).
const glyphA = await sharp(svg).resize(132, 132).png().toBuffer();
await sharp({
  create: { width: 180, height: 180, channels: 4, background: "#f4f4f6" },
})
  .composite([{ input: glyphA, gravity: "center" }])
  .png()
  .toFile(out("apple-touch-icon.png"));

console.log("icons OK: icons/icon-192.png icon-512.png maskable-512.png apple-touch-icon.png");
