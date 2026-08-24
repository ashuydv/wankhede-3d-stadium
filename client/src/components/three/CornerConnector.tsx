import { useMemo } from "react";
import * as THREE from "three";
import type { Stand } from "../../types";

interface CornerConnectorProps {
  stands: Stand[];
}

function buildArcSlab(innerRadius: number, outerRadius: number, startDeg: number, endDeg: number, depth: number) {
  const startRad = THREE.MathUtils.degToRad(startDeg);
  const endRad = THREE.MathUtils.degToRad(endDeg);
  const shape = new THREE.Shape();
  const segments = 12;
  for (let i = 0; i <= segments; i++) {
    const a = startRad + ((endRad - startRad) * i) / segments;
    const x = Math.sin(a) * outerRadius;
    const z = Math.cos(a) * outerRadius;
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  for (let i = segments; i >= 0; i--) {
    const a = startRad + ((endRad - startRad) * i) / segments;
    const x = Math.sin(a) * innerRadius;
    const z = Math.cos(a) * innerRadius;
    shape.lineTo(x, z);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
  geo.rotateX(Math.PI / 2);
  return geo;
}

/** Fills the angular gaps between adjacent stands with a low concourse wall so the
 * bowl reads as one continuous stadium instead of separate floating blocks. */
export function CornerConnector({ stands }: CornerConnectorProps) {
  const gaps = useMemo(() => {
    const sorted = [...stands].sort((a, b) => a.angleDeg - b.angleDeg);
    const result: { start: number; end: number; radius: number }[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const next = sorted[(i + 1) % sorted.length];
      const currentEnd = current.angleDeg + current.arcDeg / 2;
      let nextStart = next.angleDeg - next.arcDeg / 2;
      if (nextStart <= currentEnd) nextStart += 360;
      if (nextStart - currentEnd > 0.5) {
        result.push({
          start: currentEnd,
          end: nextStart,
          radius: Math.min(current.radius, next.radius),
        });
      }
    }
    return result;
  }, [stands]);

  return (
    <>
      {gaps.map((gap, i) => (
        <mesh
          key={i}
          geometry={buildArcSlab(gap.radius - 1, gap.radius + 19, gap.start, gap.end, 6)}
          receiveShadow
        >
          <meshStandardMaterial color="#3d4250" roughness={0.8} metalness={0.15} />
        </mesh>
      ))}
    </>
  );
}
