import { useState } from "react";
import { fetchBookingsByEmail, fetchBooking } from "../lib/api";
import type { Booking } from "../types";

interface MyBookingsModalProps {
  onClose: () => void;
}

export function MyBookingsModal({ onClose }: MyBookingsModalProps) {
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setBookings(null);
    try {
      if (query.includes("@")) {
        const results = await fetchBookingsByEmail(query.trim());
        setBookings(results);
      } else {
        const result = await fetchBooking(query.trim());
        setBookings([result]);
      }
    } catch {
      setError("No bookings found for that email or booking ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[#111318] p-6 text-white shadow-2xl no-scrollbar">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Bookings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            placeholder="Email or Booking ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "…" : "Search"}
          </button>
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        {bookings && bookings.length === 0 && (
          <div className="text-sm text-gray-400">No bookings found.</div>
        )}

        <div className="flex flex-col gap-3">
          {bookings?.map((booking) => (
            <div key={booking.id} className="rounded-md border border-gray-700 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{booking.id}</span>
                <span className="text-emerald-400">₹{booking.total.toLocaleString("en-IN")}</span>
              </div>
              <div className="mb-2 text-xs text-gray-500">
                {new Date(booking.createdAt).toLocaleString("en-IN")} · {booking.status}
              </div>
              <div className="flex flex-col gap-1">
                {booking.seats.map((seat) => (
                  <div key={seat.id} className="text-xs text-gray-400">
                    {seat.standShortName} · {seat.blockName} · Row {seat.row} · Seat {seat.seatNumber}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
