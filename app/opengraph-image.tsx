import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "dovo · disciplina compartida";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0e0d11";
const CREAM = "#f4ede0";
const MUTE = "#6e6358";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CREAM,
          padding: "72px 80px",
        }}
      >
        {/* Top: mark + edition marker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <svg width="120" height="50" viewBox="0 0 24 10">
            <circle cx="5" cy="5" r="5" fill={INK} />
            <circle cx="19" cy="5" r="5" fill={INK} />
          </svg>
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: MUTE,
              fontFamily: "monospace",
            }}
          >
            v1 · privado
          </div>
        </div>

        {/* Bottom: wordmark + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 360,
              fontWeight: 800,
              textTransform: "lowercase",
              letterSpacing: "-0.05em",
              color: INK,
              lineHeight: 0.85,
              display: "flex",
            }}
          >
            dovo
          </div>
          <div
            style={{
              fontSize: 32,
              letterSpacing: "0.22em",
              textTransform: "lowercase",
              color: MUTE,
              fontFamily: "monospace",
              display: "flex",
            }}
          >
            disciplina compartida · en dúo
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
