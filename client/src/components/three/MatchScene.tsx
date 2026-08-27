import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** A simple low-poly human figure: capsule body + sphere head. */
function Player({
  position,
  rotationY = 0,
  color = "#1d4ed8",
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.9, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#e8b98a" roughness={0.8} />
      </mesh>
    </group>
  );
}

const FIELDING_POSITIONS: [number, number, number][] = [
  [3, 0, 3], // wicketkeeper
  [8, 0, 14],
  [-8, 0, 14],
  [14, 0, 6],
  [-14, 0, 6],
  [14, 0, -4],
  [-14, 0, -4],
  [6, 0, -16],
  [-6, 0, -16],
  [0, 0, -20],
];

export function MatchScene() {
  const ballRef = useRef<THREE.Mesh>(null);
  const bowlerRef = useRef<THREE.Group>(null);
  const startTime = useRef(0);

  const fielders = useMemo(
    () => FIELDING_POSITIONS.map((pos) => ({ pos, color: "#1d4ed8" as const })),
    []
  );

  useFrame((state) => {
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const t = (state.clock.elapsedTime - startTime.current) % 4; // 4s bowling loop

    if (ballRef.current) {
      if (t < 1.5) {
        // run-up + delivery: ball travels from bowler's end to batsman's end
        const p = t / 1.5;
        const z = THREE.MathUtils.lerp(-9, 9, p);
        const arc = Math.sin(p * Math.PI) * 1.8;
        ballRef.current.position.set(0.1, 0.9 + arc, z);
        ballRef.current.visible = true;
      } else {
        ballRef.current.visible = false;
      }
    }

    if (bowlerRef.current) {
      const p = Math.min(t / 1.5, 1);
      bowlerRef.current.position.z = THREE.MathUtils.lerp(-13, -9.5, p);
    }
  });

  return (
    <group>
      {/* fielders */}
      {fielders.map((f, i) => (
        <Player key={i} position={f.pos} color={f.color} />
      ))}

      {/* bowler (runs in toward the pitch each loop) */}
      <group ref={bowlerRef} position={[0, 0, -13]}>
        <Player position={[0, 0, 0]} color="#b91c1c" />
      </group>

      {/* batsman at the striker's end */}
      <Player position={[0.5, 0, 9.5]} rotationY={Math.PI / 2} color="#ca8a04" />
      {/* non-striker */}
      <Player position={[-0.5, 0, -9.5]} rotationY={-Math.PI / 2} color="#ca8a04" />

      {/* umpire */}
      <Player position={[1.6, 0, -9]} color="#111827" />

      {/* ball */}
      <mesh ref={ballRef} castShadow>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
    </group>
  );
}
