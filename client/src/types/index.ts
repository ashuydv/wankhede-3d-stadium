export type Tier = "premium" | "club" | "general";

export interface Stand {
  id: string;
  name: string;
  shortName: string;
  tier: Tier;
  angleDeg: number;
  arcDeg: number;
  radius: number;
  rows: number;
  seatsPerRow: number;
  basePrice: number;
  description: string;
  cameraHeight: "low" | "mid" | "high";
  seatsAvailable: number;
  seatsTotal: number;
  priceRange: [number, number];
}

export interface Block {
  id: string;
  standId: string;
  name: string;
  blockIndex: number;
  rows: number;
  seatsPerRow: number;
  angleOffsetDeg: number;
  arcSpanDeg: number;
  seatsAvailable: number;
  seatsTotal: number;
}

export type SeatStatus = "available" | "held" | "booked";

export interface Seat {
  id: string;
  row: number;
  seatNumber: number;
  price: number;
  status: SeatStatus;
}

export interface CartSeat extends Seat {
  standId: string;
  standName: string;
  blockId: string;
  blockName: string;
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  total: number;
  status: string;
  createdAt: number;
  seats: {
    id: string;
    row: number;
    seatNumber: number;
    price: number;
    blockName: string;
    standName: string;
    standShortName: string;
  }[];
}

export const TIER_COLORS: Record<Tier, string> = {
  premium: "#d4af37",
  club: "#2e7d32",
  general: "#1e5fa8",
};

export const TIER_LABELS: Record<Tier, string> = {
  premium: "Premium",
  club: "Club",
  general: "General",
};
