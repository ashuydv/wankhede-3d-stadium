import { useEffect, useState } from "react";
import { Scene } from "./components/three/Scene";
import { Breadcrumb } from "./components/ui/Breadcrumb";
import { BlockPanel } from "./components/ui/BlockPanel";
import { CartPanel } from "./components/ui/CartPanel";
import { CheckoutModal } from "./pages/CheckoutModal";
import { ConfirmationModal } from "./pages/ConfirmationModal";
import { MyBookingsModal } from "./pages/MyBookingsModal";
import { SeatPreviewOverlay } from "./components/ui/SeatPreviewOverlay";
import { EnvironmentControls } from "./components/ui/EnvironmentControls";
import { fetchStands, fetchBlocks, fetchSeats } from "./lib/api";
import { useAppStore } from "./store/useAppStore";
import type { Stand, Block, Seat } from "./types";

export default function App() {
  const [stands, setStands] = useState<Stand[] | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [showMyBookings, setShowMyBookings] = useState(false);

  const viewLevel = useAppStore((s) => s.viewLevel);
  const selectedStandId = useAppStore((s) => s.selectedStandId);
  const selectedBlockId = useAppStore((s) => s.selectedBlockId);
  const previewSeatId = useAppStore((s) => s.previewSeatId);

  useEffect(() => {
    fetchStands()
      .then(setStands)
      .catch((err) => setError(err.message ?? "Failed to load stadium data"));
  }, []);

  useEffect(() => {
    if (!selectedStandId) return;
    fetchBlocks(selectedStandId)
      .then(setBlocks)
      .catch(() => setBlocks([]));
  }, [selectedStandId]);

  useEffect(() => {
    if (!selectedBlockId) {
      setSeats([]);
      return;
    }
    fetchSeats(selectedBlockId)
      .then(setSeats)
      .catch(() => setSeats([]));
  }, [selectedBlockId]);

  const selectedStand = stands?.find((s) => s.id === selectedStandId);
  const previewSeat = seats.find((s) => s.id === previewSeatId) ?? null;

  return (
    <div className="relative h-screen w-screen bg-[#0a0e14]">
      {stands && <Scene stands={stands} blocks={blocks} previewSeat={previewSeat} />}

      {!stands && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <div className="mb-3 text-lg font-semibold">Loading Wankhede Stadium…</div>
            <div className="text-sm text-gray-500">Fetching stand and seat data</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400">
          <div className="text-center">
            <div className="mb-2 text-lg font-semibold">Couldn't load stadium data</div>
            <div className="text-sm">{error}</div>
            <div className="mt-2 text-xs text-gray-500">Is the backend running on port 4000?</div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute left-6 top-6 flex items-start justify-between select-none">
        <div>
          <h1 className="text-2xl font-bold text-white">Wankhede Stadium</h1>
          <p className="text-sm text-gray-400">
            {viewLevel === "overview" ? "Click a stand to explore" : "Explore the stand"}
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowMyBookings(true)}
        className="pointer-events-auto absolute right-6 top-6 rounded-md border border-gray-600 bg-black/60 px-3 py-1.5 text-xs font-medium text-gray-200 backdrop-blur-sm hover:border-emerald-500 hover:text-emerald-400"
      >
        My Bookings
      </button>

      {stands && <Breadcrumb stands={stands} blocks={blocks} />}
      {viewLevel === "stand" && <BlockPanel blocks={blocks} />}

      {viewLevel === "stand" && selectedStand && (
        <div className="pointer-events-none absolute bottom-6 left-6 max-w-sm rounded-lg bg-black/70 p-4 text-white backdrop-blur-sm">
          <div className="text-lg font-semibold">{selectedStand.name}</div>
          <div className="mt-1 text-sm text-gray-300">{selectedStand.description}</div>
          <div className="mt-2 text-sm text-emerald-400">
            ₹{selectedStand.priceRange[0].toLocaleString("en-IN")} – ₹
            {selectedStand.priceRange[1].toLocaleString("en-IN")} · {selectedStand.seatsAvailable.toLocaleString("en-IN")} seats available
          </div>
        </div>
      )}

      {viewLevel === "overview" && <EnvironmentControls />}

      {viewLevel === "seat-preview" && previewSeat && selectedStand && (
        <SeatPreviewOverlay
          seat={previewSeat}
          stand={selectedStand}
          block={blocks.find((b) => b.id === selectedBlockId)!}
        />
      )}

      <CartPanel onCheckout={() => setShowCheckout(true)} />

      {showCheckout && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onConfirmed={(bookingId) => {
            setShowCheckout(false);
            setConfirmedBookingId(bookingId);
          }}
        />
      )}

      {confirmedBookingId && (
        <ConfirmationModal bookingId={confirmedBookingId} onClose={() => setConfirmedBookingId(null)} />
      )}

      {showMyBookings && <MyBookingsModal onClose={() => setShowMyBookings(false)} />}
    </div>
  );
}
