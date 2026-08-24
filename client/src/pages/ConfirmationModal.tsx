import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { fetchBooking } from "../lib/api";
import type { Booking } from "../types";
import { useAppStore } from "../store/useAppStore";

interface ConfirmationModalProps {
  bookingId: string;
  onClose: () => void;
}

export function ConfirmationModal({ bookingId, onClose }: ConfirmationModalProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const goToOverview = useAppStore((s) => s.goToOverview);

  useEffect(() => {
    fetchBooking(bookingId).then(setBooking);
  }, [bookingId]);

  const handleClose = () => {
    goToOverview();
    onClose();
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-[#111318] p-6 text-white shadow-2xl">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-emerald-400">
            ✓
          </div>
          <h2 className="text-lg font-semibold">Booking Confirmed</h2>
          <div className="text-sm text-gray-400">Booking ID: {bookingId}</div>
        </div>

        {!booking && <div className="py-8 text-center text-sm text-gray-400">Loading confirmation…</div>}

        {booking && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="rounded-lg bg-white p-3">
                <QRCodeSVG value={bookingId} size={140} />
              </div>
            </div>

            <div className="mb-4 rounded-md bg-white/5 p-3 text-sm">
              <div className="text-gray-300">{booking.name}</div>
              <div className="text-gray-500">{booking.email}</div>
            </div>

            <div className="mb-4 flex flex-col gap-1.5">
              {booking.seats.map((seat) => (
                <div
                  key={seat.id}
                  className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-medium">{seat.standShortName}</div>
                    <div className="text-gray-400">
                      {seat.blockName} · Row {seat.row} · Seat {seat.seatNumber}
                    </div>
                  </div>
                  <span className="text-emerald-400">₹{seat.price.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between border-t border-gray-700 pt-3">
              <span className="text-sm text-gray-300">Total Paid</span>
              <span className="text-lg font-semibold text-emerald-400">
                ₹{booking.total.toLocaleString("en-IN")}
              </span>
            </div>
          </>
        )}

        <button
          onClick={handleClose}
          className="w-full rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400"
        >
          Done
        </button>
      </div>
    </div>
  );
}
