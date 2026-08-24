import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { fetchSeats } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";
import type { Block, Stand, Seat } from "../../types";

interface SeatGridProps {
  stand: Stand;
  block: Block;
}

const SEAT_SIZE = 0.9;
const SEAT_GAP = 1.3;
const ROW_GAP = 1.5;

const STATUS_COLOR: Record<string, string> = {
  available: "#22c55e",
  held: "#f59e0b",
  booked: "#525252",
};

const SELECTED_COLOR = "#38bdf8";
const HOVER_COLOR = "#ffffff";

export function SeatGrid({ stand, block }: SeatGridProps) {
  const [seats, setSeats] = useState<Seat[] | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);

  useEffect(() => {
    let cancelled = false;
    fetchSeats(block.id).then((data) => {
      if (!cancelled) setSeats(data);
    });
    return () => {
      cancelled = true;
    };
  }, [block.id]);

  const gridWidth = (block.seatsPerRow - 1) * SEAT_GAP;
  const gridDepth = (block.rows - 1) * ROW_GAP;

  const angleRad = THREE.MathUtils.degToRad(block.angleOffsetDeg + block.arcSpanDeg / 2);
  const groupPos = useMemo(() => {
    const r = stand.radius - 4;
    return new THREE.Vector3(Math.sin(angleRad) * r, 1, Math.cos(angleRad) * r);
  }, [angleRad, stand.radius]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current || !seats) return;
    seats.forEach((seat, i) => {
      const row = seat.row - 1;
      const col = seat.seatNumber - 1;
      const x = col * SEAT_GAP - gridWidth / 2;
      const z = row * ROW_GAP - gridDepth / 2;
      const y = row * 0.35; // slight tier rise per row
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      const inCart = cart.some((c) => c.id === seat.id);
      const color =
        i === hoveredIndex && seat.status === "available"
          ? HOVER_COLOR
          : inCart
          ? SELECTED_COLOR
          : STATUS_COLOR[seat.status] ?? STATUS_COLOR.available;
      meshRef.current!.setColorAt(i, new THREE.Color(color));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    // InstancedMesh raycasting relies on its own boundingSphere (covering all
    // instances), not the geometry's — must be recomputed after moving instances.
    meshRef.current.computeBoundingSphere();
  }, [seats, cart, hoveredIndex, dummy, gridWidth, gridDepth]);

  if (!seats) return null;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id === undefined) return;
    const seat = seats[id];
    if (!seat || seat.status !== "available") return;

    const inCart = cart.some((c) => c.id === seat.id);
    if (inCart) {
      removeFromCart(seat.id);
    } else {
      addToCart({
        ...seat,
        standId: stand.id,
        standName: stand.name,
        blockId: block.id,
        blockName: block.name,
      });
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id === undefined) return;
    const seat = seats[id];
    if (seat && seat.status === "available") {
      setHoveredIndex(id);
      document.body.style.cursor = "pointer";
    } else {
      setHoveredIndex(null);
      document.body.style.cursor = "auto";
    }
  };

  const handlePointerOut = () => {
    setHoveredIndex(null);
    document.body.style.cursor = "auto";
  };

  const hoveredSeat = hoveredIndex !== null ? seats[hoveredIndex] : null;

  return (
    <group position={groupPos} rotation={[0, angleRad, 0]}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, seats.length]}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        castShadow
      >
        <boxGeometry args={[SEAT_SIZE, 0.7, SEAT_SIZE]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>

      {hoveredSeat && (
        <Html
          position={[
            (hoveredSeat.seatNumber - 1) * SEAT_GAP - gridWidth / 2,
            (hoveredSeat.row - 1) * 0.35 + 1.2,
            (hoveredSeat.row - 1) * ROW_GAP - gridDepth / 2,
          ]}
          center
          distanceFactor={20}
          occlude
        >
          <div className="pointer-events-none select-none whitespace-nowrap rounded-md bg-black/85 px-2.5 py-1 text-center text-white shadow-xl">
            <div className="text-xs font-semibold">
              Row {hoveredSeat.row} · Seat {hoveredSeat.seatNumber}
            </div>
            <div className="text-xs text-emerald-400">₹{hoveredSeat.price.toLocaleString("en-IN")}</div>
          </div>
        </Html>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[gridWidth + 6, gridDepth + 6]} />
        <meshStandardMaterial color="#1c1f26" roughness={1} />
      </mesh>
    </group>
  );
}
