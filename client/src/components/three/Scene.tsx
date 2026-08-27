import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { StadiumOverview } from "./StadiumOverview";
import { CameraRig } from "./CameraRig";
import { SkyBackground } from "./SkyBackground";
import type { Stand, Block, Seat } from "../../types";

interface SceneProps {
  stands: Stand[];
  blocks: Block[];
  previewSeat: Seat | null;
}

export function Scene({ stands, blocks, previewSeat }: SceneProps) {
  const orbitControlsRef = useRef<any>(null);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 110, 170], fov: 50, near: 0.1, far: 1000 }}
      dpr={[1, 1.5]}
    >
      <SkyBackground />
      <StadiumOverview stands={stands} blocks={blocks} />
      <CameraRig
        stands={stands}
        blocks={blocks}
        previewSeat={previewSeat}
        orbitControlsRef={orbitControlsRef}
      />
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
