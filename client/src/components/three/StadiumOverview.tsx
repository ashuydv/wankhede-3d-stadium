import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { Pitch } from "./Pitch";
import { Stand } from "./Stand";
import { BlockMarkers } from "./BlockMarkers";
import { SeatGrid } from "./SeatGrid";
import { FloodlightTower } from "./FloodlightTower";
import { CornerConnector } from "./CornerConnector";
import { MatchScene } from "./MatchScene";
import type { Stand as StandType, Block } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import { getSunState } from "../../lib/sunPosition";

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
  const matchModeOn = useAppStore((s) => s.matchModeOn);
  const timeOfDay = useAppStore((s) => s.timeOfDay);

  const isOverview = viewLevel === "overview";

  const floodlightPositions = useMemo(() => {
    const radius = 108;
    const angles = [45, 135, 225, 315];
    return angles.map((deg) => {
      const rad = THREE.MathUtils.degToRad(deg);
      return [Math.sin(rad) * radius, 0, Math.cos(rad) * radius] as [number, number, number];
    });
  }, []);

  const sun = useMemo(() => getSunState(timeOfDay), [timeOfDay]);
  const skyColor = useMemo(() => {
    // warm low sun near sunrise/sunset, blue-white at noon, dark navy at night
    if (sun.daylight <= 0) return new THREE.Color("#05070d");
    const noon = new THREE.Color("#bcd7ff");
    const horizon = new THREE.Color("#ff9d5c");
    const t = Math.min(sun.daylight * 2.2, 1);
    return horizon.clone().lerp(noon, t);
  }, [sun]);

  return (
    <Suspense fallback={null}>
      <ambientLight intensity={0.25 + sun.daylight * 0.4} />
      <directionalLight
        position={sun.position}
        intensity={sun.daylight * 1.6 + 0.08}
        color={sun.daylight < 0.3 ? "#ffb37a" : "#ffffff"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      <hemisphereLight args={[skyColor, "#2a2a2a", 0.3 + sun.daylight * 0.3]} />

      <Pitch />

      {matchModeOn && <MatchScene />}

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
        floodlightPositions.map((pos, i) => (
          <FloodlightTower key={i} position={pos} daylight={sun.daylight} />
        ))}

      {viewLevel === "stand" &&
        (() => {
          const stand = stands.find((s) => s.id === selectedStandId);
          if (!stand) return null;
          return <BlockMarkers stand={stand} blocks={blocks} />;
        })()}

      {(viewLevel === "block" || viewLevel === "seats" || viewLevel === "seat-preview") &&
        (() => {
          const stand = stands.find((s) => s.id === selectedStandId);
          const block = blocks.find((b) => b.id === selectedBlockId);
          if (!stand || !block) return null;
          return <SeatGrid stand={stand} block={block} />;
        })()}
    </Suspense>
  );
}
