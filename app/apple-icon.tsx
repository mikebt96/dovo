import { ImageResponse } from "next/og";
import { COLOR } from "@/lib/brand";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const { ink: INK, cream: CREAM } = COLOR;

// iOS home screen icon — aplica máscara redonda automática,
// por eso aquí solo se centra el mark sobre BG crema (sin borderRadius).
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="120" height="50" viewBox="0 0 24 10">
          <circle cx="5" cy="5" r="5" fill={INK} />
          <circle cx="19" cy="5" r="5" fill={INK} />
        </svg>
      </div>
    ),
    { ...size },
  );
}
