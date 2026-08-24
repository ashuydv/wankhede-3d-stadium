import { useMemo } from "react";
import * as THREE from "three";

interface FloodlightTowerProps {
  position: [number, number, number];
  height?: number;
}

export function FloodlightTower({ position, height = 42 }: FloodlightTowerProps) {
  const lampPositions = useMemo(() => {
    const rows = 6;
    const cols = 5;
    const positions: [number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push([(c - (cols - 1) / 2) * 0.9, (r - (rows - 1) / 2) * 0.9]);
      }
    }
    return positions;
  }, []);

  return (
    <group position={position}>
      {/* mast */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.75, height, 8]} />
        <meshStandardMaterial color="#5a5f6b" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* lamp cluster frame */}
      <group position={[0, height + 0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[5, 0.3, 3.5]} />
          <meshStandardMaterial color="#2c2f36" roughness={0.6} metalness={0.4} />
        </mesh>
        {lampPositions.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.25, z]}>
            <cylinderGeometry args={[0.18, 0.18, 0.15, 8]} />
            <meshStandardMaterial color="#fff8e0" emissive="#fff2c0" emissiveIntensity={1.2} />
          </mesh>
        ))}
      </group>

      <pointLight position={[0, height + 1, 0]} intensity={40} distance={140} decay={2} color="#fff8e8" />
    </group>
  );
}
