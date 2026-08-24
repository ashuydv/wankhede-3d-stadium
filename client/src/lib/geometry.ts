export const PITCH_LENGTH = 66;
export const PITCH_WIDTH = 46;

export function cameraHeightToY(height: "low" | "mid" | "high"): number {
  switch (height) {
    case "low":
      return 14;
    case "mid":
      return 24;
    case "high":
      return 38;
  }
}
