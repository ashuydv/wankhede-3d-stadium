import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "data", "stadium.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stands (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      tier TEXT NOT NULL,
      angle_deg REAL NOT NULL,
      arc_deg REAL NOT NULL,
      radius REAL NOT NULL,
      rows INTEGER NOT NULL,
      seats_per_row INTEGER NOT NULL,
      base_price INTEGER NOT NULL,
      description TEXT NOT NULL,
      camera_height TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      stand_id TEXT NOT NULL REFERENCES stands(id),
      name TEXT NOT NULL,
      block_index INTEGER NOT NULL,
      rows INTEGER NOT NULL,
      seats_per_row INTEGER NOT NULL,
      angle_offset_deg REAL NOT NULL,
      arc_span_deg REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS seats (
      id TEXT PRIMARY KEY,
      block_id TEXT NOT NULL REFERENCES blocks(id),
      stand_id TEXT NOT NULL REFERENCES stands(id),
      row_num INTEGER NOT NULL,
      seat_num INTEGER NOT NULL,
      price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'available', -- available | held | booked
      hold_expires_at INTEGER,
      hold_token TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_seats_block ON seats(block_id);
    CREATE INDEX IF NOT EXISTS idx_seats_stand ON seats(stand_id);
    CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      seat_ids TEXT NOT NULL, -- JSON array
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
  `);
}
