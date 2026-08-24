import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { StadiumOverview } from "./StadiumOverview";
import { CameraRig } from "./CameraRig";
import type { Stand, Block } from "../../types";

interface SceneProps {
  stands: Stand[];
  blocks: Block[];
}

export function Scene({ stands, blocks }: SceneProps) {
  const orbitControlsRef = useRef<any>(null);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 110, 170], fov: 50, near: 0.1, far: 1000 }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={["#0a0e14"]} />
      <fog attach="fog" args={["#0a0e14", 150, 400]} />
      <Stars radius={200} depth={50} count={2000} factor={2} fade speed={0.5} />
      <StadiumOverview stands={stands} blocks={blocks} />
      <CameraRig stands={stands} blocks={blocks} orbitControlsRef={orbitControlsRef} />
      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        enablePan={false}
        minDistance={5}
        maxDistance={280}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 5, 0]}
      />
    </Canvas>
  );
}
