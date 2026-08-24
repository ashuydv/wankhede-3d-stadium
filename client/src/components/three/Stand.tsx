import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { Stand as StandType } from "../../types";
import { TIER_COLORS } from "../../types";

interface StandProps {
  stand: StandType;
  onSelect: (standId: string) => void;
  onHover: (standId: string | null) => void;
  isHovered: boolean;
  dimmed: boolean;
  showLabel: boolean;
}

const TIER_HEIGHT: Record<string, number> = {
  premium: 10,
  club: 16,
  general: 20,
};

/**
 * Builds a stepped seating bank: a ring of actual rising steps (riser + tread)
 * from innerRadius out to outerRadius, so the bank reads as tiered rows rather
 * than a smooth ramp. Returns one merged BufferGeometry.
 */
function buildSteppedBank(
  innerRadius: number,
  outerRadius: number,
  arcDeg: number,
  totalHeight: number,
  stepCount: number
): THREE.BufferGeometry {
  const arcRad = THREE.MathUtils.degToRad(arcDeg);
  const segmentsPerStep = 10;
  const stepDepth = (outerRadius - innerRadius) / stepCount;
  const stepRise = totalHeight / stepCount;

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const addQuad = (
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    p3: THREE.Vector3,
    p4: THREE.Vector3,
    normal: THREE.Vector3
  ) => {
    // ensure winding order actually matches the intended normal (self-correcting,
    // since deriving CCW-vs-CW by hand for every quad type is error-prone)
    const edge1 = new THREE.Vector3().subVectors(p2, p1);
    const edge2 = new THREE.Vector3().subVectors(p3, p1);
    const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2);
    const flip = faceNormal.dot(normal) < 0;
    const [a, b, c, d] = flip ? [p1, p4, p3, p2] : [p1, p2, p3, p4];

    const base = positions.length / 3;
    [a, b, c, d].forEach((p) => positions.push(p.x, p.y, p.z));
    for (let i = 0; i < 4; i++) normals.push(normal.x, normal.y, normal.z);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  const radialPoint = (radius: number, y: number, t: number) => {
    const a = -arcRad / 2 + arcRad * t;
    return new THREE.Vector3(Math.sin(a) * radius, y, Math.cos(a) * radius);
  };

  // for each step: a rising riser face (facing inward/down-slope) + a flat tread on top
  for (let s = 0; s < stepCount; s++) {
    const rInner = innerRadius + s * stepDepth;
    const rOuter = innerRadius + (s + 1) * stepDepth;
    const yTop = (s + 1) * stepRise;
    const yBottom = s * stepRise;

    // riser (vertical-ish face at rInner, from yBottom to yTop)
    for (let i = 0; i < segmentsPerStep; i++) {
      const t0 = i / segmentsPerStep;
      const t1 = (i + 1) / segmentsPerStep;
      const a0 = radialPoint(rInner, yBottom, t0);
      const b0 = radialPoint(rInner, yBottom, t1);
      const a1 = radialPoint(rInner, yTop, t0);
      const b1 = radialPoint(rInner, yTop, t1);
      const mid = -arcRad / 2 + arcRad * (t0 + t1) / 2;
      const normal = new THREE.Vector3(-Math.sin(mid), 0, -Math.cos(mid));
      addQuad(a0, b0, b1, a1, normal);
    }

    // tread (top of this step, from rInner to rOuter, at yTop)
    for (let i = 0; i < segmentsPerStep; i++) {
      const t0 = i / segmentsPerStep;
      const t1 = (i + 1) / segmentsPerStep;
      const a0 = radialPoint(rInner, yTop, t0);
      const b0 = radialPoint(rInner, yTop, t1);
      const a1 = radialPoint(rOuter, yTop, t0);
      const b1 = radialPoint(rOuter, yTop, t1);
      const normal = new THREE.Vector3(0, 1, 0);
      addQuad(a0, b0, b1, a1, normal);
    }
  }

  // back wall (outer radius, from 0 up to full height) closing the bank
  for (let i = 0; i < segmentsPerStep; i++) {
    const t0 = i / segmentsPerStep;
    const t1 = (i + 1) / segmentsPerStep;
    const a0 = radialPoint(outerRadius, 0, t0);
    const b0 = radialPoint(outerRadius, 0, t1);
    const a1 = radialPoint(outerRadius, totalHeight, t0);
    const b1 = radialPoint(outerRadius, totalHeight, t1);
    const mid = -arcRad / 2 + arcRad * (t0 + t1) / 2;
    const normal = new THREE.Vector3(Math.sin(mid), 0, Math.cos(mid));
    addQuad(a0, b0, b1, a1, normal);
  }

  // end caps (flat triangular-ish walls at each side of the arc) so the bank
  // doesn't look hollow when viewed edge-on
  for (const side of [0, 1]) {
    const t = side;
    const a = -arcRad / 2 + arcRad * t;
    const inner0 = new THREE.Vector3(Math.sin(a) * innerRadius, 0, Math.cos(a) * innerRadius);
    const outer0 = new THREE.Vector3(Math.sin(a) * outerRadius, 0, Math.cos(a) * outerRadius);
    const outerTop = new THREE.Vector3(Math.sin(a) * outerRadius, totalHeight, Math.cos(a) * outerRadius);
    const innerTop = new THREE.Vector3(Math.sin(a) * innerRadius, totalHeight, Math.cos(a) * innerRadius);
    const normal = new THREE.Vector3(Math.cos(a) * (side === 0 ? -1 : 1), 0, -Math.sin(a) * (side === 0 ? -1 : 1));
    if (side === 0) addQuad(inner0, outer0, outerTop, innerTop, normal);
    else addQuad(outer0, inner0, innerTop, outerTop, normal);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

function buildArcSlab(innerRadius: number, outerRadius: number, arcDeg: number, depth: number) {
  const arcRad = THREE.MathUtils.degToRad(arcDeg);
  const shape = new THREE.Shape();
  const segments = 24;
  for (let i = 0; i <= segments; i++) {
    const a = -arcRad / 2 + (arcRad * i) / segments;
    const x = Math.sin(a) * outerRadius;
    const z = Math.cos(a) * outerRadius;
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  for (let i = segments; i >= 0; i--) {
    const a = -arcRad / 2 + (arcRad * i) / segments;
    const x = Math.sin(a) * innerRadius;
    const z = Math.cos(a) * innerRadius;
    shape.lineTo(x, z);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });
  geo.rotateX(Math.PI / 2);
  return geo;
}

export function Stand({ stand, onSelect, onHover, isHovered, dimmed, showLabel }: StandProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [localHover, setLocalHover] = useState(false);

  const color = TIER_COLORS[stand.tier];
  const height = TIER_HEIGHT[stand.tier] ?? 14;
  const innerRadius = stand.radius;
  const outerRadius = stand.radius + 18;
  const roofHeight = height + 3;

  const bankGeometry = useMemo(
    () => buildSteppedBank(innerRadius, outerRadius, stand.arcDeg, height, Math.max(6, Math.round(stand.rows / 2))),
    [innerRadius, outerRadius, stand.arcDeg, height, stand.rows]
  );

  // roof canopy: a slightly tilted slab cantilevered out from the back of the stand
  const roofGeometry = useMemo(
    () => buildArcSlab(outerRadius - 6, outerRadius + 5, stand.arcDeg + 3, 0.8),
    [outerRadius, stand.arcDeg]
  );

  // support columns holding the roof, spaced along the arc
  const columnPositions = useMemo(() => {
    const count = Math.max(3, Math.round(stand.arcDeg / 12));
    const arcRad = THREE.MathUtils.degToRad(stand.arcDeg);
    const r = outerRadius - 1;
    const cols: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const a = -arcRad / 2 + (arcRad * i) / (count - 1 || 1);
      cols.push([Math.sin(a) * r, 0, Math.cos(a) * r]);
    }
    return cols;
  }, [stand.arcDeg, outerRadius]);

  const active = isHovered || localHover;

  const labelRadius = (innerRadius + outerRadius) / 2;
  const labelPos: [number, number, number] = [0, height + 6, labelRadius];

  const rotationY = THREE.MathUtils.degToRad(stand.angleDeg);

  return (
    <group
      ref={groupRef}
      rotation={[0, rotationY, 0]}
      onPointerOver={(e) => {
        if (dimmed) return;
        e.stopPropagation();
        setLocalHover(true);
        onHover(stand.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        if (dimmed) return;
        e.stopPropagation();
        setLocalHover(false);
        onHover(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        if (dimmed) return;
        e.stopPropagation();
        onSelect(stand.id);
      }}
    >
      {/* stepped seating bank */}
      <mesh geometry={bankGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.75}
          metalness={0.05}
          opacity={dimmed ? 0.35 : 1}
          transparent={dimmed}
          emissive={active ? color : "#000000"}
          emissiveIntensity={active ? 0.3 : 0}
        />
      </mesh>

      {/* concourse base beneath the bank, closes the gap to the ground */}
      <mesh
        geometry={buildArcSlab(innerRadius - 1, outerRadius + 1, stand.arcDeg + 1, 1)}
        position={[0, -1, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#23262e" roughness={0.9} opacity={dimmed ? 0.35 : 1} transparent={dimmed} />
      </mesh>

      {/* roof canopy */}
      <mesh geometry={roofGeometry} position={[0, roofHeight, 0]} rotation={[-0.05, 0, 0]}>
        <meshStandardMaterial
          color="#3a3f4b"
          roughness={0.4}
          metalness={0.4}
          opacity={dimmed ? 0.35 : 0.95}
          transparent
        />
      </mesh>

      {/* roof support columns */}
      {!dimmed &&
        columnPositions.map((pos, i) => (
          <mesh key={i} position={[pos[0], (height + roofHeight) / 2, pos[2]]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, roofHeight - height + 1, 8]} />
            <meshStandardMaterial color="#4b5160" roughness={0.5} metalness={0.5} />
          </mesh>
        ))}

      {active && !dimmed && showLabel && (
        <Html position={labelPos} center distanceFactor={60} occlude>
          <div className="pointer-events-none select-none rounded-lg bg-black/80 px-3 py-2 text-center text-white shadow-xl backdrop-blur-sm whitespace-nowrap">
            <div className="text-sm font-semibold">{stand.name}</div>
            <div className="text-xs text-gray-300">
              ₹{stand.priceRange[0].toLocaleString("en-IN")} – ₹{stand.priceRange[1].toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-emerald-400">{stand.seatsAvailable.toLocaleString("en-IN")} seats available</div>
          </div>
        </Html>
      )}
    </group>
  );
}
