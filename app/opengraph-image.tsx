import { ImageResponse } from "next/og";

// OG image dinámica (1200×630) generada por Next.js Edge Runtime — sin dependencias de imagen.
// Se muestra al compartir dovofit.com en WhatsApp, Twitter/X, iMessage, LinkedIn.
// Usa el sistema Ultraviolet: panel oscuro premium + signal violeta + geist-like text.
export const runtime = "edge";
export const alt = "dovo — stronger in pairs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "radial-gradient(130% 150% at 12% 0%, #16132a 0%, #0b0a14 55%, #07060d 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Glow orb */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -60,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(109,74,255,0.35) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Wordmark */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#f4f4f6",
            letterSpacing: "-0.03em",
            display: "flex",
          }}
        >
          dovo
        </div>
        {/* Hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#6d4aff",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            STRONGER IN PAIRS
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: "#f4f4f6",
              letterSpacing: "-0.04em",
              lineHeight: 0.88,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>fitness</span>
            <span style={{ color: "#6d4aff" }}>en dúo.</span>
          </div>
        </div>
        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.02em",
              display: "flex",
            }}
          >
            dovofit.com
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            <span>check-ins</span>
            <span>niveles</span>
            <span>retos</span>
            <span>nutrición</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
