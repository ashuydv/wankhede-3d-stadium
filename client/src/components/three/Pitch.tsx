import { useMemo } from "react";
import * as THREE from "three";
import { PITCH_LENGTH, PITCH_WIDTH } from "../../lib/geometry";

function ovalGeometry(rx: number, rz: number) {
  const shape = new THREE.Shape();
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.sin(a) * rx;
    const z = Math.cos(a) * rz;
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  const geo = new THREE.ShapeGeometry(shape, segments);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function ovalRingGeometry(rx: number, rz: number, thickness: number) {
  const outer = new THREE.Shape();
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.sin(a) * rx;
    const z = Math.cos(a) * rz;
    if (i === 0) outer.moveTo(x, z);
    else outer.lineTo(x, z);
  }
  const hole = new THREE.Path();
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.sin(a) * (rx - thickness);
    const z = Math.cos(a) * (rz - thickness);
    if (i === 0) hole.moveTo(x, z);
    else hole.lineTo(x, z);
  }
  outer.holes.push(hole);
  const geo = new THREE.ShapeGeometry(outer, segments);
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/** Alternating light/dark mow-stripe texture, like a real maintained outfield. */
function useMowStripeTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const stripeCount = 14;
    const stripeWidth = size / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#2f8132" : "#2a7530";
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

export function Pitch() {
  const outfieldRx = PITCH_WIDTH * 0.62;
  const outfieldRz = PITCH_LENGTH * 0.62;
  const outfieldGeo = useMemo(() => ovalGeometry(outfieldRx, outfieldRz), [outfieldRx, outfieldRz]);
  const boundaryGeo = useMemo(() => ovalRingGeometry(outfieldRx, outfieldRz, 0.6), [outfieldRx, outfieldRz]);
  const trackGeo = useMemo(
    () => ovalRingGeometry(outfieldRx + 6, outfieldRz + 6, 6),
    [outfieldRx, outfieldRz]
  );
  const mowTexture = useMowStripeTexture();

  return (
    <group>
      {/* green apron between the boundary and the stands, so the whole ground reads as one field */}
      <mesh geometry={trackGeo} position={[0, -0.02, 0]} receiveShadow>
        <meshStandardMaterial map={mowTexture} roughness={0.95} />
      </mesh>

      {/* outfield with mow stripes */}
      <mesh geometry={outfieldGeo} receiveShadow position={[0, 0, 0]}>
        <meshStandardMaterial map={mowTexture} roughness={0.9} />
      </mesh>

      {/* pitch strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[3.2, 20]} />
        <meshStandardMaterial color="#c9b37c" roughness={0.8} />
      </mesh>
      {/* crease markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 8.5]}>
        <planeGeometry args={[3.6, 0.15]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -8.5]}>
        <planeGeometry args={[3.6, 0.15]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
      {/* stumps */}
      {[8.7, -8.7].map((z) => (
        <group key={z} position={[0, 0.04, z]}>
          {[-0.35, 0, 0.35].map((x) => (
            <mesh key={x} position={[x, 0.35, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
              <meshStandardMaterial color="#e8dcc0" />
            </mesh>
          ))}
        </group>
      ))}
      {/* boundary rope */}
      <mesh geometry={boundaryGeo} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}
