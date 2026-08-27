import * as THREE from "three";
import type { Block, Stand } from "../types";

export const SEAT_GAP = 1.3;
export const ROW_GAP = 1.5;

/**
 * Computes the exact world position of a seat within a block's grid, matching
 * the instance-matrix math in SeatGrid.tsx. Used both to place the instanced
 * seat mesh and to fly the camera to a first-person "sit in this seat" view.
 */
export function getSeatWorldPosition(
  stand: Stand,
  block: Block,
  row: number,
  seatNumber: number
): THREE.Vector3 {
  const gridWidth = (block.seatsPerRow - 1) * SEAT_GAP;
  const gridDepth = (block.rows - 1) * ROW_GAP;

  const localX = (seatNumber - 1) * SEAT_GAP - gridWidth / 2;
  const localZ = (row - 1) * ROW_GAP - gridDepth / 2;
  const localY = (row - 1) * 0.35;

  const angleRad = THREE.MathUtils.degToRad(block.angleOffsetDeg + block.arcSpanDeg / 2);
  const groupRadius = stand.radius - 4;
  const groupPos = new THREE.Vector3(
    Math.sin(angleRad) * groupRadius,
    1,
    Math.cos(angleRad) * groupRadius
  );

  // the seat grid group is rotated by angleRad around Y, so rotate the local
  // offset into world space before translating by the group's position
  const local = new THREE.Vector3(localX, localY, localZ);
  local.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad);

  return groupPos.add(local);
}
