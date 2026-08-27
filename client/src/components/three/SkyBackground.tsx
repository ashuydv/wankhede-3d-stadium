import { useMemo } from "react";
import * as THREE from "three";
import { Stars } from "@react-three/drei";
import { useAppStore } from "../../store/useAppStore";
import { getSunState } from "../../lib/sunPosition";

// Sky gradient keyframes, ordered by daylight (0 -> 1). Deliberately includes
// an intermediate "dawn blue" stop between the orange horizon and the deep
// noon blue — straight-line RGB lerp between two near-complementary hues
// (orange <-> blue) passes through muddy grey/purple, so we route through
// enough stops that no single lerp segment crosses more than ~90 deg of hue.
const SKY_STOPS: { at: number; rgb: [number, number, number] }[] = [
  { at: 0, rgb: [0x05, 0x07, 0x0d] }, // night
  { at: 0.15, rgb: [0x2b, 0x2a, 0x3d] }, // pre-dawn
  { at: 0.35, rgb: [0xd9, 0x7a, 0x3f] }, // sunrise/sunset orange
  { at: 0.6, rgb: [0x8f, 0x9b, 0xc2] }, // mid-morning/afternoon blue-grey
  { at: 1, rgb: [0x79, 0xa6, 0xe0] }, // full noon blue
];

function lerpRgb(a: [number, number, number], b: [number, number, number], t: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t)) as [number, number, number];
}

function skyColorFor(daylight: number): [number, number, number] {
  const d = THREE.MathUtils.clamp(daylight, 0, 1);
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[i + 1];
    if (d >= a.at && d <= b.at) {
      const t = (d - a.at) / (b.at - a.at);
      return lerpRgb(a.rgb, b.rgb, t);
    }
  }
  return SKY_STOPS[SKY_STOPS.length - 1].rgb;
}

export function SkyBackground() {
  const timeOfDay = useAppStore((s) => s.timeOfDay);
  const sun = useMemo(() => getSunState(timeOfDay), [timeOfDay]);

  const bgColor = useMemo(() => {
    // Interpolate directly in sRGB (0-255) space, not via THREE.Color.lerp() —
    // that lerps in linear-light space, which introduces its own hue shifts.
    const rgb = skyColorFor(sun.daylight);
    const hex = rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
    return new THREE.Color(`#${hex}`);
  }, [sun]);

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 150, 400]} />
      {sun.daylight < 0.4 && (
        <Stars radius={200} depth={50} count={2000} factor={2} fade speed={0.5} />
      )}
    </>
  );
}
