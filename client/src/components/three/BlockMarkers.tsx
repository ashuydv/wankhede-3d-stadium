import { useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useAppStore } from "../../store/useAppStore";
import type { Stand, Block } from "../../types";

interface BlockMarkersProps {
  stand: Stand;
  blocks: Block[];
}

function BlockMarker({ stand, block }: { stand: Stand; block: Block }) {
  const [hovered, setHovered] = useState(false);
  const goToBlock = useAppStore((s) => s.goToBlock);

  const angleRad = THREE.MathUtils.degToRad(block.angleOffsetDeg + block.arcSpanDeg / 2);
  const radius = stand.radius + 8;
  const pos: [number, number, number] = [Math.sin(angleRad) * radius, 6, Math.cos(angleRad) * radius];

  return (
    <group position={pos}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          goToBlock(block.id);
        }}
      >
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? "#facc15" : "#ffffff"}
          emissive={hovered ? "#facc15" : "#888888"}
          emissiveIntensity={0.6}
        />
      </mesh>
      {hovered && (
        <Html center distanceFactor={30} occlude>
          <div className="pointer-events-none select-none whitespace-nowrap rounded-md bg-black/80 px-3 py-1.5 text-center text-white shadow-xl">
            <div className="text-sm font-semibold">{block.name}</div>
            <div className="text-xs text-gray-300">
              Rows 1–{block.rows} · {block.seatsAvailable} seats available
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function BlockMarkers({ stand, blocks }: BlockMarkersProps) {
  return (
    <>
      {blocks.map((block) => (
        <BlockMarker key={block.id} stand={stand} block={block} />
      ))}
    </>
  );
}
