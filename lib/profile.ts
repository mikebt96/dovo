import type { ProfileId } from "./types";

export const PROFILES: Record<ProfileId, {
  id: ProfileId;
  displayName: string;
  color: string;
  partnerId: ProfileId;
  baselineKcal: number;
  baselineProteinG: number;
  activeSports: string[];
}> = {
  mike: {
    id: "mike",
    displayName: "Mike",
    color: "#6bf5ff",
    partnerId: "andy",
    baselineKcal: 2400,
    baselineProteinG: 155,
    activeSports: ["gym", "caminadora"],
  },
  andy: {
    id: "andy",
    displayName: "Andy",
    color: "#ff6b9d",
    partnerId: "mike",
    baselineKcal: 1750,
    baselineProteinG: 115,
    activeSports: ["gym", "ballet", "pilates"],
  },
};

export function isProfileId(x: string): x is ProfileId {
  return x === "mike" || x === "andy";
}

export function getProfile(id: string) {
  if (!isProfileId(id)) return null;
  return PROFILES[id];
}
