import { create } from "zustand";
import type { CartSeat } from "../types";

export type ViewLevel = "overview" | "stand" | "block" | "seats" | "seat-preview";

interface AppState {
  viewLevel: ViewLevel;
  selectedStandId: string | null;
  hoveredStandId: string | null;
  selectedBlockId: string | null;
  previewSeatId: string | null;

  cart: CartSeat[];
  holdToken: string | null;
  holdExpiresAt: number | null;

  matchModeOn: boolean;
  timeOfDay: number; // 0-24 hours

  goToOverview: () => void;
  goToStand: (standId: string) => void;
  goToBlock: (blockId: string) => void;
  goToSeats: () => void;
  goToSeatPreview: (seatId: string) => void;
  setHoveredStand: (standId: string | null) => void;

  addToCart: (seat: CartSeat) => void;
  removeFromCart: (seatId: string) => void;
  clearCart: () => void;
  setHold: (holdToken: string, expiresAt: number) => void;
  clearHold: () => void;

  setMatchModeOn: (on: boolean) => void;
  setTimeOfDay: (hours: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  viewLevel: "overview",
  selectedStandId: null,
  hoveredStandId: null,
  selectedBlockId: null,
  previewSeatId: null,

  cart: [],
  holdToken: null,
  holdExpiresAt: null,

  matchModeOn: false,
  timeOfDay: 15,

  goToOverview: () => set({ viewLevel: "overview", selectedStandId: null, selectedBlockId: null, previewSeatId: null }),
  goToStand: (standId) => set({ viewLevel: "stand", selectedStandId: standId, selectedBlockId: null, previewSeatId: null }),
  goToBlock: (blockId) => set({ viewLevel: "block", selectedBlockId: blockId, previewSeatId: null }),
  goToSeats: () => set({ viewLevel: "seats", previewSeatId: null }),
  goToSeatPreview: (seatId) => set({ viewLevel: "seat-preview", previewSeatId: seatId }),
  setHoveredStand: (standId) => set({ hoveredStandId: standId }),

  addToCart: (seat) => {
    if (get().cart.some((s) => s.id === seat.id)) return;
    set({ cart: [...get().cart, seat] });
  },
  removeFromCart: (seatId) => set({ cart: get().cart.filter((s) => s.id !== seatId) }),
  clearCart: () => set({ cart: [], holdToken: null, holdExpiresAt: null }),
  setHold: (holdToken, expiresAt) => set({ holdToken, holdExpiresAt: expiresAt }),
  clearHold: () => set({ holdToken: null, holdExpiresAt: null }),

  setMatchModeOn: (on) => set({ matchModeOn: on }),
  setTimeOfDay: (hours) => set({ timeOfDay: hours }),
}));
