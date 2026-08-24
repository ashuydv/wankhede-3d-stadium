import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { Pitch } from "./Pitch";
import { Stand } from "./Stand";
import { BlockMarkers } from "./BlockMarkers";
import { SeatGrid } from "./SeatGrid";
import { FloodlightTower } from "./FloodlightTower";
import { CornerConnector } from "./CornerConnector";
import type { Stand as StandType, Block } from "../../types";
import { useAppStore } from "../../store/useAppStore";

interface StadiumOverviewProps {
  stands: StandType[];
  blocks: Block[];
}

export function StadiumOverview({ stands, blocks }: StadiumOverviewProps) {
  const hoveredStandId = useAppStore((s) => s.hoveredStandId);
  const setHoveredStand = useAppStore((s) => s.setHoveredStand);
  const goToStand = useAppStore((s) => s.goToStand);
  const viewLevel = useAppStore((s) => s.viewLevel);
  const selectedStandId = useAppStore((s) => s.selectedStandId);
  const selectedBlockId = useAppStore((s) => s.selectedBlockId);

  const isOverview = viewLevel === "overview";

  const floodlightPositions = useMemo(() => {
    const radius = 108;
    const angles = [45, 135, 225, 315];
    return angles.map((deg) => {
      const rad = THREE.MathUtils.degToRad(deg);
      return [Math.sin(rad) * radius, 0, Math.cos(rad) * radius] as [number, number, number];
    });
  }, []);

  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[60, 90, 40]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <hemisphereLight args={["#bcd7ff", "#2a2a2a", 0.4]} />

      <Pitch />

      <CornerConnector stands={stands} />

      {stands.map((stand) => (
        <Stand
          key={stand.id}
          stand={stand}
          onSelect={goToStand}
          onHover={setHoveredStand}
          isHovered={hoveredStandId === stand.id}
          dimmed={!isOverview && selectedStandId !== stand.id}
          showLabel={isOverview}
        />
      ))}

      {/* ground plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <circleGeometry args={[140, 64]} />
        <meshStandardMaterial color="#1a1d24" roughness={1} />
      </mesh>

      {isOverview &&
        floodlightPositions.map((pos, i) => <FloodlightTower key={i} position={pos} />)}

      {viewLevel === "stand" &&
        (() => {
          const stand = stands.find((s) => s.id === selectedStandId);
          if (!stand) return null;
          return <BlockMarkers stand={stand} blocks={blocks} />;
        })()}

      {(viewLevel === "block" || viewLevel === "seats") &&
        (() => {
          const stand = stands.find((s) => s.id === selectedStandId);
          const block = blocks.find((b) => b.id === selectedBlockId);
          if (!stand || !block) return null;
          return <SeatGrid stand={stand} block={block} />;
        })()}
    </Suspense>
  );
}
