import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dovo",
    short_name: "dovo",
    description: "tratos entre dos.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f1ea",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
