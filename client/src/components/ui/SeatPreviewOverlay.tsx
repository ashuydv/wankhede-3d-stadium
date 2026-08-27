import { useAppStore } from "../../store/useAppStore";
import type { Seat, Stand, Block } from "../../types";

interface SeatPreviewOverlayProps {
  seat: Seat;
  stand: Stand;
  block: Block;
}

export function SeatPreviewOverlay({ seat, stand, block }: SeatPreviewOverlayProps) {
  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const goToBlock = useAppStore((s) => s.goToBlock);

  const inCart = cart.some((c) => c.id === seat.id);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* vignette to sell the "sitting in the stand" feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="pointer-events-auto absolute left-1/2 bottom-8 flex -translate-x-1/2 flex-col items-center gap-3 rounded-xl bg-black/75 px-6 py-4 text-center text-white backdrop-blur-sm">
        <div>
          <div className="text-sm font-semibold">
            {stand.shortName} · {block.name} · Row {seat.row} · Seat {seat.seatNumber}
          </div>
          <div className="text-xs text-gray-400">This is the view from your seat</div>
          <div className="mt-1 text-lg font-semibold text-emerald-400">
            ₹{seat.price.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => goToBlock(block.id)}
            className="rounded-md border border-gray-600 px-4 py-2 text-sm font-medium hover:border-gray-400"
          >
            ← Back to grid
          </button>
          {seat.status === "available" && (
            <button
              onClick={() => (inCart ? removeFromCart(seat.id) : addToCart({ ...seat, standId: stand.id, standName: stand.name, blockId: block.id, blockName: block.name }))}
              className={
                inCart
                  ? "rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-black hover:bg-sky-400"
                  : "rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
              }
            >
              {inCart ? "✓ Added — remove" : "Select this seat"}
            </button>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute left-6 top-24 rounded-md bg-black/60 px-3 py-1.5 text-xs text-gray-300 backdrop-blur-sm">
        First-person seat preview — drag to look around
      </div>
    </div>
  );
}
