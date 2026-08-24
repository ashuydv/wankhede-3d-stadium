import { create } from "zustand";
import type { CartSeat } from "../types";

export type ViewLevel = "overview" | "stand" | "block" | "seats";

interface AppState {
  viewLevel: ViewLevel;
  selectedStandId: string | null;
  hoveredStandId: string | null;
  selectedBlockId: string | null;

  cart: CartSeat[];
  holdToken: string | null;
  holdExpiresAt: number | null;

  goToOverview: () => void;
  goToStand: (standId: string) => void;
  goToBlock: (blockId: string) => void;
  goToSeats: () => void;
  setHoveredStand: (standId: string | null) => void;

  addToCart: (seat: CartSeat) => void;
  removeFromCart: (seatId: string) => void;
  clearCart: () => void;
  setHold: (holdToken: string, expiresAt: number) => void;
  clearHold: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  viewLevel: "overview",
  selectedStandId: null,
  hoveredStandId: null,
  selectedBlockId: null,

  cart: [],
  holdToken: null,
  holdExpiresAt: null,

  goToOverview: () => set({ viewLevel: "overview", selectedStandId: null, selectedBlockId: null }),
  goToStand: (standId) => set({ viewLevel: "stand", selectedStandId: standId, selectedBlockId: null }),
  goToBlock: (blockId) => set({ viewLevel: "block", selectedBlockId: blockId }),
  goToSeats: () => set({ viewLevel: "seats" }),
  setHoveredStand: (standId) => set({ hoveredStandId: standId }),

  addToCart: (seat) => {
    if (get().cart.some((s) => s.id === seat.id)) return;
    set({ cart: [...get().cart, seat] });
  },
  removeFromCart: (seatId) => set({ cart: get().cart.filter((s) => s.id !== seatId) }),
  clearCart: () => set({ cart: [], holdToken: null, holdExpiresAt: null }),
  setHold: (holdToken, expiresAt) => set({ holdToken, holdExpiresAt: expiresAt }),
  clearHold: () => set({ holdToken: null, holdExpiresAt: null }),
}));
