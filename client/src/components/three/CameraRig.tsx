import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore } from "../../store/useAppStore";
import type { Stand, Block, Seat } from "../../types";
import { cameraHeightToY } from "../../lib/geometry";
import { getSeatWorldPosition } from "../../lib/seatPosition";

interface CameraRigProps {
  stands: Stand[];
  blocks: Block[];
  previewSeat: Seat | null;
  orbitControlsRef: React.RefObject<any>;
}

const OVERVIEW_POS = new THREE.Vector3(0, 110, 170);
const OVERVIEW_TARGET = new THREE.Vector3(0, 5, 0);

const TIER_HEIGHT: Record<string, number> = {
  premium: 10,
  club: 16,
  general: 20,
};

function standVantage(stand: Stand): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const angleRad = THREE.MathUtils.degToRad(stand.angleDeg);
  const bankHeight = (TIER_HEIGHT[stand.tier] ?? 14) * 1.1;
  // seated at the pitch-facing edge of this stand, at a height reflecting its real
  // vantage point (low & close for the Pavilion, high & set back for North Stand),
  // looking across the pitch — a real spectator's point of view from these seats
  const y = bankHeight * 0.45 + cameraHeightToY(stand.cameraHeight) * 0.4;
  const camRadius = stand.radius - 3;
  const pos = new THREE.Vector3(Math.sin(angleRad) * camRadius, y, Math.cos(angleRad) * camRadius);
  const target = new THREE.Vector3(0, 2, 0);
  return { pos, target };
}

const EYE_HEIGHT = 1.15; // seated eye height above the seat surface

function seatVantage(
  stand: Stand,
  block: Block,
  seat: Seat
): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const seatPos = getSeatWorldPosition(stand, block, seat.row, seat.seatNumber);
  const pos = seatPos.clone().setY(seatPos.y + EYE_HEIGHT);
  // look toward the pitch center, slightly above ground so the view isn't tilted into the turf
  const target = new THREE.Vector3(0, 1.5, 0);
  return { pos, target };
}

function blockVantage(_stand: Stand, block: Block): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const angleRad = THREE.MathUtils.degToRad(block.angleOffsetDeg + block.arcSpanDeg / 2);
  const gridCenterRadius = _stand.radius - 4;
  const gridCenter = new THREE.Vector3(
    Math.sin(angleRad) * gridCenterRadius,
    1,
    Math.cos(angleRad) * gridCenterRadius
  );
  // hover above and slightly behind the seat grid, looking down at it for easy selection
  const behind = new THREE.Vector3(Math.sin(angleRad), 0, Math.cos(angleRad)).multiplyScalar(14);
  const pos = gridCenter.clone().add(behind).setY(24);
  const target = gridCenter.clone().setY(0);
  return { pos, target };
}

export function CameraRig({ stands, blocks, previewSeat, orbitControlsRef }: CameraRigProps) {
  const { camera } = useThree();
  const viewLevel = useAppStore((s) => s.viewLevel);
  const selectedStandId = useAppStore((s) => s.selectedStandId);
  const selectedBlockId = useAppStore((s) => s.selectedBlockId);

  const targetPos = useRef(new THREE.Vector3().copy(OVERVIEW_POS));
  const targetLookAt = useRef(new THREE.Vector3().copy(OVERVIEW_TARGET));
  const animating = useRef(false);

  useEffect(() => {
    let pos = OVERVIEW_POS;
    let target = OVERVIEW_TARGET;

    const stand = stands.find((s) => s.id === selectedStandId);
    const block = blocks.find((b) => b.id === selectedBlockId);

    if (viewLevel === "seat-preview" && stand && block && previewSeat) {
      const v = seatVantage(stand, block, previewSeat);
      pos = v.pos;
      target = v.target;
    } else if (viewLevel === "stand" || viewLevel === "block" || viewLevel === "seats") {
      if (stand) {
        if ((viewLevel === "block" || viewLevel === "seats") && block) {
          const v = blockVantage(stand, block);
          pos = v.pos;
          target = v.target;
        } else {
          const v = standVantage(stand);
          pos = v.pos;
          target = v.target;
        }
      }
    }

    targetPos.current.copy(pos);
    targetLookAt.current.copy(target);
    animating.current = true;
  }, [viewLevel, selectedStandId, selectedBlockId, stands, blocks, previewSeat]);

  useFrame(() => {
    if (!animating.current) return;
    const controls = orbitControlsRef.current;
    camera.position.lerp(targetPos.current, 0.06);

    if (controls) {
      controls.target.lerp(targetLookAt.current, 0.06);
      controls.update();
    }

    const distPos = camera.position.distanceTo(targetPos.current);
    const distTarget = controls ? controls.target.distanceTo(targetLookAt.current) : 0;
    if (distPos < 0.05 && distTarget < 0.05) {
      animating.current = false;
    }
  });

  return null;
}
