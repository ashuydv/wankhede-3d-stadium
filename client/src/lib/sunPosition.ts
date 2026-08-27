import * as THREE from "three";

/**
 * Simplified sun model: sunrise at 6:00, solar noon at 12:00, sunset at 18:00.
 * Returns a world-space direction the light travels *from* (i.e. the light's
 * position direction), plus how "daytime" it is (0 = night, 1 = full day) so
 * callers can fade sky color / floodlight intensity accordingly.
 */
export function getSunState(hours: number) {
  const dayProgress = (hours - 6) / 12; // 0 at sunrise, 1 at sunset
  const elevationAngle = Math.sin(Math.PI * THREE.MathUtils.clamp(dayProgress, -0.2, 1.2));
  const elevation = Math.max(elevationAngle, -0.15) * (Math.PI / 2.1);

  // sun moves across the south sky (simplified): east at sunrise, overhead-ish
  // at noon, west at sunset, sweeping across a fixed azimuth arc
  const azimuth = THREE.MathUtils.lerp(-Math.PI * 0.65, Math.PI * 0.65, THREE.MathUtils.clamp(dayProgress, 0, 1));

  const distance = 140;
  const x = Math.sin(azimuth) * Math.cos(elevation) * distance;
  const y = Math.max(Math.sin(elevation) * distance, 4);
  const z = Math.cos(azimuth) * Math.cos(elevation) * distance;

  const daylight = THREE.MathUtils.clamp(elevationAngle, 0, 1);

  return {
    position: new THREE.Vector3(x, y, z),
    daylight, // 0 (night) -> 1 (full day)
    isNight: hours < 5.5 || hours > 19,
  };
}

export function formatHour(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}
