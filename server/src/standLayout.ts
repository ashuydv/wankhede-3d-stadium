// Approximate relative layout of Wankhede Stadium stands around the oval pitch.
// angleDeg: 0 = along +Z (one long side), going clockwise when viewed from above.
// tier drives seat pricing and color.

export type Tier = "premium" | "club" | "general";

export interface StandDef {
  id: string;
  name: string;
  shortName: string;
  tier: Tier;
  angleDeg: number; // position around the oval, degrees
  arcDeg: number; // how much of the oval this stand spans
  radius: number; // distance from pitch center to stand's inner edge
  rows: number;
  seatsPerRow: number;
  blocks: number; // number of blocks this stand is divided into
  basePrice: number;
  description: string;
  cameraHeight: "low" | "mid" | "high";
}

export const TIER_COLORS: Record<Tier, string> = {
  premium: "#d4af37", // gold
  club: "#2e7d32", // green
  general: "#1e5fa8", // blue
};

export const STAND_LAYOUT: StandDef[] = [
  {
    id: "mca-pavilion",
    name: "MCA Members' Pavilion",
    shortName: "Pavilion",
    tier: "premium",
    angleDeg: 0,
    arcDeg: 40,
    radius: 70,
    rows: 14,
    seatsPerRow: 40,
    blocks: 4,
    basePrice: 8000,
    description: "Premium members' pavilion, closest to the pitch with the best low vantage point.",
    cameraHeight: "low",
  },
  {
    id: "divecha-pavilion",
    name: "Divecha Pavilion",
    shortName: "Divecha",
    tier: "premium",
    angleDeg: 40,
    arcDeg: 30,
    radius: 72,
    rows: 10,
    seatsPerRow: 36,
    blocks: 3,
    basePrice: 7000,
    description: "Corporate boxes and premium hospitality seating overlooking the pitch.",
    cameraHeight: "low",
  },
  {
    id: "sachin-tendulkar",
    name: "Sachin Tendulkar Stand",
    shortName: "Tendulkar",
    tier: "club",
    angleDeg: 90,
    arcDeg: 60,
    radius: 78,
    rows: 24,
    seatsPerRow: 50,
    blocks: 6,
    basePrice: 3500,
    description: "Named after the legendary Master Blaster, behind one end of the ground.",
    cameraHeight: "mid",
  },
  {
    id: "north-stand",
    name: "North Stand",
    shortName: "North",
    tier: "general",
    angleDeg: 150,
    arcDeg: 45,
    radius: 80,
    rows: 30,
    seatsPerRow: 55,
    blocks: 6,
    basePrice: 1500,
    description: "The famous vocal North Stand, elevated and set back behind the boundary.",
    cameraHeight: "high",
  },
  {
    id: "sunil-gavaskar",
    name: "Sunil Gavaskar Stand",
    shortName: "Gavaskar",
    tier: "club",
    angleDeg: 205,
    arcDeg: 60,
    radius: 78,
    rows: 24,
    seatsPerRow: 50,
    blocks: 6,
    basePrice: 3500,
    description: "Named after Sunil Gavaskar, opposite the Tendulkar Stand.",
    cameraHeight: "mid",
  },
  {
    id: "east-stand",
    name: "East Stand (Curator's End)",
    shortName: "East / Curator's",
    tier: "general",
    angleDeg: 270,
    arcDeg: 35,
    radius: 80,
    rows: 28,
    seatsPerRow: 45,
    blocks: 4,
    basePrice: 1200,
    description: "General seating near the curator's end of the ground.",
    cameraHeight: "high",
  },
  {
    id: "vijay-merchant",
    name: "Vijay Merchant Stand",
    shortName: "Merchant",
    tier: "general",
    angleDeg: 315,
    arcDeg: 45,
    radius: 78,
    rows: 26,
    seatsPerRow: 48,
    blocks: 5,
    basePrice: 1800,
    description: "Named after Vijay Merchant, offering wide-angle views of the ground.",
    cameraHeight: "mid",
  },
];

export const PITCH_LENGTH = 66; // along Z
export const PITCH_WIDTH = 46; // along X (oval field width)
