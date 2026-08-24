# Wankhede Stadium — 3D Ticket Booking

A 3D interactive seat-selection ticket booking demo for Wankhede Stadium, Mumbai. Orbit the stadium, fly into a stand, pick a block, select seats, and complete a mock checkout — all backed by a real SQLite seat inventory with concurrency-safe holds.

## Stack

- **Client**: React + TypeScript + Vite, react-three-fiber / drei (Three.js), Zustand, Tailwind CSS
- **Server**: Node + Express + TypeScript, SQLite (better-sqlite3)

## Project layout

```
client/   React app (3D scene, booking UI)
server/   Express API + SQLite seat inventory
```

## Running the dev servers

Two terminals, both from the project root:

```bash
# Terminal 1 — backend (http://localhost:4000)
cd server
npm install
npm run seed   # populate stands/blocks/seats (safe to re-run any time)
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the backend on port 4000.

## Reseeding the database

Reseeding wipes and repopulates stands, blocks, seats, and clears bookings:

```bash
cd server
npm run seed
```

Seat/stand layout lives in `server/src/standLayout.ts` — edit stand names, radii, row/seat counts, or pricing there, then reseed.

## How the booking flow works

1. **Overview** — orbit the full stadium; hover a stand for its name, price range, and live seat availability.
2. **Stand fly-in** — clicking a stand animates the camera to a vantage point reflecting that stand's real character (low & close for the MCA Pavilion, high & set back for the North Stand).
3. **Block selection** — a side panel lists the stand's blocks with live availability; picking one flies the camera to a top-down view of that block's seat grid.
4. **Seat selection** — seats render as an `InstancedMesh` grid colored by status (green = available, amber = held, grey = booked, blue = selected). Click to add/remove from cart.
5. **Cart & hold** — selecting a seat calls `POST /api/seats/hold`, which soft-locks it for 10 minutes server-side so two users can't double-book; the cart panel shows a live countdown.
6. **Checkout** — enter name/email/phone, a mock "Pay" step, then `POST /api/bookings` atomically converts the held seats into a confirmed booking (rejecting if the hold expired or was taken).
7. **Confirmation** — booking ID, QR code, and seat recap.
8. **My Bookings** — look up past bookings by email or booking ID via the button top-right.

## Data model

- `stands` — id, name, tier (premium/club/general), angular position + radius around the pitch, row/seat counts, base price, camera vantage
- `blocks` — subdivisions of a stand (e.g. "Block A"), each with its own angular slice
- `seats` — individual seats with row/seat number, price (front rows cost more), and status (`available` / `held` / `booked`)
- `bookings` — customer info, booked seat ids, total, timestamp

Total seeded inventory is ~7,400 seats across 7 stands — scaled down from Wankhede's real ~33,000 capacity for demo performance, while keeping proportions and relative stand sizes realistic.

## Performance notes

- Seats are rendered as a single `InstancedMesh` per block (not individual mesh objects), so a full grid of a few hundred seats is one draw call.
- Individual seat geometry only mounts once you're at block/seat level — the stadium overview and stand fly-in never render per-seat detail.
