import { useEffect, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import { holdSeats, releaseSeats } from "../../lib/api";

interface CartPanelProps {
  onCheckout: () => void;
}

export function CartPanel({ onCheckout }: CartPanelProps) {
  const cart = useAppStore((s) => s.cart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const holdToken = useAppStore((s) => s.holdToken);
  const holdExpiresAt = useAppStore((s) => s.holdExpiresAt);
  const setHold = useAppStore((s) => s.setHold);
  const clearHold = useAppStore((s) => s.clearHold);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // (re)hold seats whenever the cart changes
  useEffect(() => {
    if (cart.length === 0) {
      clearHold();
      return;
    }
    const seatIds = cart.map((s) => s.id);
    holdSeats(seatIds, holdToken ?? undefined)
      .then(({ holdToken: token, expiresAt }) => setHold(token, expiresAt))
      .catch(() => {
        // hold failed (seat taken) — silently ignore for now, checkout will re-validate
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.map((s) => s.id).join(",")]);

  const total = cart.reduce((sum, s) => sum + s.price, 0);

  const secondsLeft = holdExpiresAt ? Math.max(0, Math.floor((holdExpiresAt - now) / 1000)) : null;
  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : null;

  const handleRemove = async (seatId: string) => {
    removeFromCart(seatId);
    if (holdToken) {
      await releaseSeats([seatId], holdToken).catch(() => {});
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute right-6 bottom-6 flex w-80 flex-col rounded-lg bg-black/80 text-white backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <div className="text-sm font-semibold">Your Cart ({cart.length})</div>
        {secondsLeft !== null && (
          <div className={`text-xs ${secondsLeft < 60 ? "text-red-400" : "text-amber-400"}`}>
            Held: {minutes}:{String(seconds).padStart(2, "0")}
          </div>
        )}
      </div>

      <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto p-3 no-scrollbar">
        {cart.map((seat) => (
          <div
            key={seat.id}
            className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-xs"
          >
            <div>
              <div className="font-medium">{seat.standName}</div>
              <div className="text-gray-400">
                {seat.blockName} · Row {seat.row} · Seat {seat.seatNumber}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400">₹{seat.price.toLocaleString("en-IN")}</span>
              <button
                onClick={() => handleRemove(seat.id)}
                className="text-gray-400 hover:text-red-400"
                aria-label="Remove seat"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-700 px-4 py-3">
        <div className="text-sm text-gray-300">Total</div>
        <div className="text-lg font-semibold text-emerald-400">₹{total.toLocaleString("en-IN")}</div>
      </div>

      <button
        onClick={onCheckout}
        disabled={!holdToken}
        className="m-3 rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
