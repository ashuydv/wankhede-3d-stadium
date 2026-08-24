import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { db, initSchema } from "./db.js";

initSchema();

const app = express();
app.use(cors());
app.use(express.json());

const HOLD_DURATION_MS = 10 * 60 * 1000; // 10 minutes

function releaseExpiredHolds() {
  const now = Date.now();
  db.prepare(
    `UPDATE seats SET status = 'available', hold_expires_at = NULL, hold_token = NULL
     WHERE status = 'held' AND hold_expires_at IS NOT NULL AND hold_expires_at < ?`
  ).run(now);
}

// run a sweep periodically
setInterval(releaseExpiredHolds, 15_000);

// ---------- Stands ----------
app.get("/api/stands", (_req, res) => {
  releaseExpiredHolds();
  const stands = db.prepare(`SELECT * FROM stands`).all() as any[];
  const counts = db
    .prepare(
      `SELECT stand_id, status, COUNT(*) as c, MIN(price) as min_price, MAX(price) as max_price
       FROM seats GROUP BY stand_id, status`
    )
    .all() as any[];

  const result = stands.map((s) => {
    const rows = counts.filter((c) => c.stand_id === s.id);
    const available = rows.find((r) => r.status === "available")?.c ?? 0;
    const total = rows.reduce((sum, r) => sum + r.c, 0);
    const minPrice = Math.min(...rows.map((r) => r.min_price).filter((x) => x != null));
    const maxPrice = Math.max(...rows.map((r) => r.max_price).filter((x) => x != null));
    return {
      id: s.id,
      name: s.name,
      shortName: s.short_name,
      tier: s.tier,
      angleDeg: s.angle_deg,
      arcDeg: s.arc_deg,
      radius: s.radius,
      rows: s.rows,
      seatsPerRow: s.seats_per_row,
      basePrice: s.base_price,
      description: s.description,
      cameraHeight: s.camera_height,
      seatsAvailable: available,
      seatsTotal: total,
      priceRange: [minPrice, maxPrice],
    };
  });

  res.json(result);
});

app.get("/api/stands/:standId", (req, res) => {
  const stand = db.prepare(`SELECT * FROM stands WHERE id = ?`).get(req.params.standId) as any;
  if (!stand) return res.status(404).json({ error: "Stand not found" });
  res.json(stand);
});

// ---------- Blocks ----------
app.get("/api/stands/:standId/blocks", (req, res) => {
  releaseExpiredHolds();
  const blocks = db
    .prepare(`SELECT * FROM blocks WHERE stand_id = ? ORDER BY block_index`)
    .all(req.params.standId) as any[];

  const counts = db
    .prepare(
      `SELECT block_id, status, COUNT(*) as c FROM seats WHERE stand_id = ? GROUP BY block_id, status`
    )
    .all(req.params.standId) as any[];

  const result = blocks.map((b) => {
    const rows = counts.filter((c) => c.block_id === b.id);
    const available = rows.find((r) => r.status === "available")?.c ?? 0;
    const total = rows.reduce((sum, r) => sum + r.c, 0);
    return {
      id: b.id,
      standId: b.stand_id,
      name: b.name,
      blockIndex: b.block_index,
      rows: b.rows,
      seatsPerRow: b.seats_per_row,
      angleOffsetDeg: b.angle_offset_deg,
      arcSpanDeg: b.arc_span_deg,
      seatsAvailable: available,
      seatsTotal: total,
    };
  });

  res.json(result);
});

// ---------- Seats ----------
app.get("/api/blocks/:blockId/seats", (req, res) => {
  releaseExpiredHolds();
  const seats = db
    .prepare(
      `SELECT id, row_num, seat_num, price, status FROM seats WHERE block_id = ? ORDER BY row_num, seat_num`
    )
    .all(req.params.blockId) as any[];

  res.json(
    seats.map((s) => ({
      id: s.id,
      row: s.row_num,
      seatNumber: s.seat_num,
      price: s.price,
      status: s.status,
    }))
  );
});

// ---------- Seat hold (soft lock) ----------
app.post("/api/seats/hold", (req, res) => {
  releaseExpiredHolds();
  const { seatIds, holdToken } = req.body as { seatIds: string[]; holdToken?: string };
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "seatIds required" });
  }
  const token = holdToken || randomUUID();
  const expiresAt = Date.now() + HOLD_DURATION_MS;

  const holdTx = db.transaction((ids: string[]) => {
    const placeholders = ids.map(() => "?").join(",");
    const seats = db
      .prepare(`SELECT id, status, hold_token FROM seats WHERE id IN (${placeholders})`)
      .all(...ids) as any[];

    if (seats.length !== ids.length) {
      throw new Error("One or more seats not found");
    }

    const unavailable = seats.filter(
      (s) => s.status === "booked" || (s.status === "held" && s.hold_token !== token)
    );
    if (unavailable.length > 0) {
      throw new Error(`Seats already unavailable: ${unavailable.map((s) => s.id).join(", ")}`);
    }

    const update = db.prepare(
      `UPDATE seats SET status = 'held', hold_expires_at = ?, hold_token = ? WHERE id = ?`
    );
    for (const id of ids) update.run(expiresAt, token, id);
  });

  try {
    holdTx(seatIds);
    res.json({ holdToken: token, expiresAt });
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

app.post("/api/seats/release", (req, res) => {
  const { seatIds, holdToken } = req.body as { seatIds: string[]; holdToken: string };
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "seatIds required" });
  }
  const placeholders = seatIds.map(() => "?").join(",");
  db.prepare(
    `UPDATE seats SET status = 'available', hold_expires_at = NULL, hold_token = NULL
     WHERE id IN (${placeholders}) AND hold_token = ? AND status = 'held'`
  ).run(...seatIds, holdToken);
  res.json({ ok: true });
});

// ---------- Bookings ----------
app.post("/api/bookings", (req, res) => {
  releaseExpiredHolds();
  const { name, email, phone, seatIds, holdToken } = req.body as {
    name: string;
    email: string;
    phone: string;
    seatIds: string[];
    holdToken: string;
  };

  if (!name || !email || !phone || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const bookTx = db.transaction(() => {
    const placeholders = seatIds.map(() => "?").join(",");
    const seats = db
      .prepare(`SELECT id, price, status, hold_token FROM seats WHERE id IN (${placeholders})`)
      .all(...seatIds) as any[];

    if (seats.length !== seatIds.length) {
      throw new Error("One or more seats not found");
    }
    const invalid = seats.filter((s) => s.status !== "held" || s.hold_token !== holdToken);
    if (invalid.length > 0) {
      throw new Error("Seat hold expired or invalid — please reselect your seats");
    }

    const total = seats.reduce((sum, s) => sum + s.price, 0);
    const bookingId = `WKD-${randomUUID().slice(0, 8).toUpperCase()}`;
    const createdAt = Date.now();

    db.prepare(
      `INSERT INTO bookings (id, name, email, phone, seat_ids, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?)`
    ).run(bookingId, name, email, phone, JSON.stringify(seatIds), total, createdAt);

    const update = db.prepare(
      `UPDATE seats SET status = 'booked', hold_expires_at = NULL, hold_token = NULL WHERE id = ?`
    );
    for (const id of seatIds) update.run(id);

    return { bookingId, total, createdAt };
  });

  try {
    const result = bookTx();
    res.json(result);
  } catch (err: any) {
    res.status(409).json({ error: err.message });
  }
});

app.get("/api/bookings/:bookingId", (req, res) => {
  const booking = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(req.params.bookingId) as any;
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  res.json(formatBooking(booking));
});

app.get("/api/bookings", (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: "email query param required" });
  const bookings = db
    .prepare(`SELECT * FROM bookings WHERE email = ? ORDER BY created_at DESC`)
    .all(email) as any[];
  res.json(bookings.map(formatBooking));
});

function formatBooking(booking: any) {
  const seatIds: string[] = JSON.parse(booking.seat_ids);
  const placeholders = seatIds.map(() => "?").join(",");
  const seats = seatIds.length
    ? (db
        .prepare(
          `SELECT seats.id, seats.row_num, seats.seat_num, seats.price, blocks.name as block_name,
                  stands.name as stand_name, stands.short_name as stand_short_name
           FROM seats
           JOIN blocks ON blocks.id = seats.block_id
           JOIN stands ON stands.id = seats.stand_id
           WHERE seats.id IN (${placeholders})`
        )
        .all(...seatIds) as any[])
    : [];

  return {
    id: booking.id,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    total: booking.total,
    status: booking.status,
    createdAt: booking.created_at,
    seats: seats.map((s) => ({
      id: s.id,
      row: s.row_num,
      seatNumber: s.seat_num,
      price: s.price,
      blockName: s.block_name,
      standName: s.stand_name,
      standShortName: s.stand_short_name,
    })),
  };
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Wankhede booking API listening on http://localhost:${PORT}`);
});
