import { db, initSchema } from "./db.js";
import { STAND_LAYOUT, TIER_COLORS } from "./standLayout.js";
import { randomUUID } from "node:crypto";

function priceForRow(basePrice: number, rows: number, rowIndex: number): number {
  // front rows cost more, tapering toward the back
  const frontBoost = 1.4;
  const backFactor = 0.8;
  const t = rowIndex / Math.max(1, rows - 1);
  const multiplier = frontBoost - t * (frontBoost - backFactor);
  return Math.round((basePrice * multiplier) / 50) * 50;
}

function seed() {
  initSchema();

  const clearAll = db.transaction(() => {
    db.exec("DELETE FROM bookings; DELETE FROM seats; DELETE FROM blocks; DELETE FROM stands;");
  });
  clearAll();

  const insertStand = db.prepare(`
    INSERT INTO stands (id, name, short_name, tier, angle_deg, arc_deg, radius, rows, seats_per_row, base_price, description, camera_height)
    VALUES (@id, @name, @shortName, @tier, @angleDeg, @arcDeg, @radius, @rows, @seatsPerRow, @basePrice, @description, @cameraHeight)
  `);

  const insertBlock = db.prepare(`
    INSERT INTO blocks (id, stand_id, name, block_index, rows, seats_per_row, angle_offset_deg, arc_span_deg)
    VALUES (@id, @standId, @name, @blockIndex, @rows, @seatsPerRow, @angleOffsetDeg, @arcSpanDeg)
  `);

  const insertSeat = db.prepare(`
    INSERT INTO seats (id, block_id, stand_id, row_num, seat_num, price, status)
    VALUES (@id, @blockId, @standId, @rowNum, @seatNum, @price, 'available')
  `);

  const blockLetters = "ABCDEFGHIJ".split("");

  const runSeed = db.transaction(() => {
    let totalSeats = 0;

    for (const stand of STAND_LAYOUT) {
      insertStand.run({
        id: stand.id,
        name: stand.name,
        shortName: stand.shortName,
        tier: stand.tier,
        angleDeg: stand.angleDeg,
        arcDeg: stand.arcDeg,
        radius: stand.radius,
        rows: stand.rows,
        seatsPerRow: stand.seatsPerRow,
        basePrice: stand.basePrice,
        description: stand.description,
        cameraHeight: stand.cameraHeight,
      });

      const blocksCount = stand.blocks;
      const seatsPerBlockRow = Math.round(stand.seatsPerRow / blocksCount);
      const arcSpanPerBlock = stand.arcDeg / blocksCount;

      for (let b = 0; b < blocksCount; b++) {
        const blockId = `${stand.id}-block-${blockLetters[b]}`;
        const blockName = `Block ${blockLetters[b]}`;
        insertBlock.run({
          id: blockId,
          standId: stand.id,
          name: blockName,
          blockIndex: b,
          rows: stand.rows,
          seatsPerRow: seatsPerBlockRow,
          angleOffsetDeg: stand.angleDeg - stand.arcDeg / 2 + arcSpanPerBlock * b,
          arcSpanDeg: arcSpanPerBlock,
        });

        for (let r = 0; r < stand.rows; r++) {
          const price = priceForRow(stand.basePrice, stand.rows, r);
          for (let s = 0; s < seatsPerBlockRow; s++) {
            insertSeat.run({
              id: randomUUID(),
              blockId,
              standId: stand.id,
              rowNum: r + 1,
              seatNum: s + 1,
              price,
            });
            totalSeats++;
          }
        }
      }
    }

    console.log(`Seeded ${STAND_LAYOUT.length} stands, total seats: ${totalSeats}`);
    console.log("Tier colors:", TIER_COLORS);
  });

  runSeed();
}

seed();
