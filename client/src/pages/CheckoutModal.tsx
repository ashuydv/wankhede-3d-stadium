import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { createBooking } from "../lib/api";

interface CheckoutModalProps {
  onClose: () => void;
  onConfirmed: (bookingId: string) => void;
}

export function CheckoutModal({ onClose, onConfirmed }: CheckoutModalProps) {
  const cart = useAppStore((s) => s.cart);
  const holdToken = useAppStore((s) => s.holdToken);
  const clearCart = useAppStore((s) => s.clearCart);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"details" | "payment">("details");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cart.reduce((sum, s) => sum + s.price, 0);
  const detailsValid = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && phone.trim().length >= 7;

  const handlePay = async () => {
    if (!holdToken) {
      setError("Your seat hold has expired. Please reselect your seats.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await createBooking({
        name,
        email,
        phone,
        seatIds: cart.map((s) => s.id),
        holdToken,
      });
      clearCart();
      onConfirmed(result.bookingId);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-[#111318] p-6 text-white shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Checkout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-md bg-white/5 p-3 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>{cart.length} ticket{cart.length !== 1 ? "s" : ""}</span>
            <span className="font-semibold text-emerald-400">₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {step === "details" && (
          <div className="flex flex-col gap-3">
            <input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <input
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <div className="text-xs text-gray-500">Tickets: {cart.length} (matches selected seats)</div>
            <button
              disabled={!detailsValid}
              onClick={() => setStep("payment")}
              className="mt-2 rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Payment
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-gray-700 p-3 text-sm text-gray-300">
              <div>Name: {name}</div>
              <div>Email: {email}</div>
              <div>Phone: {phone}</div>
            </div>
            <div className="rounded-md border border-dashed border-gray-600 p-4 text-center text-sm text-gray-400">
              Mock payment — no real charge will be made.
            </div>
            {error && <div className="text-sm text-red-400">{error}</div>}
            <div className="flex gap-2">
              <button
                onClick={() => setStep("details")}
                className="flex-1 rounded-md border border-gray-600 py-2.5 text-sm font-medium hover:border-gray-400"
              >
                Back
              </button>
              <button
                onClick={handlePay}
                disabled={submitting}
                className="flex-1 rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Processing…" : `Pay ₹${total.toLocaleString("en-IN")}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
