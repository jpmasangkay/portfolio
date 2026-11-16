export interface DayNightState {
  phase: number; // 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk
  label: "Midnight" | "Dawn" | "Daylight" | "Dusk";
  emoji: string;
  /** 0 in bright midday, 1 in deep night — controls street lanterns & warm window glow */
  lanternFactor: number;
  ambientIntensity: number;
  dirIntensity: number;
  dirColorHex: number;
  skyTintHex: number;
  sunHeight: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpHex(hexA: number, hexB: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const rA = (hexA >> 16) & 0xff;
  const gA = (hexA >> 8) & 0xff;
  const bA = hexA & 0xff;
  const rB = (hexB >> 16) & 0xff;
  const gB = (hexB >> 8) & 0xff;
  const bB = hexB & 0xff;
  const r = Math.round(lerp(rA, rB, clamped));
  const g = Math.round(lerp(gA, gB, clamped));
  const b = Math.round(lerp(bA, bB, clamped));
  return (r << 16) | (g << 8) | b;
}

/**
 * Compute continuous sky, lighting, and lantern activation from normalized phase [0, 1).
 * When nightPinned is true, locks cleanly to the crisp Batch C moonlit night look.
 */
export function computeDayNightState(cyclePhase: number, nightPinned: boolean): DayNightState {
  if (nightPinned) {
    return {
      phase: 0,
      label: "Midnight",
      emoji: "🌙",
      lanternFactor: 1,
      ambientIntensity: 0.95,
      dirIntensity: 1.75,
      dirColorHex: 0xaabbe8,
      skyTintHex: 0x161932,
      sunHeight: 35,
    };
  }

  const p = ((cyclePhase % 1) + 1) % 1;
  // cos curve: +1 at midday (p=0.5), -1 at midnight (p=0)
  const dayFactor = (1 - Math.cos(p * Math.PI * 2)) / 2;
  // dusk/dawn bell centered at 0.25 and 0.75
  const twilightFactor = Math.max(0, 1 - Math.abs(dayFactor - 0.5) * 4);
  const lanternFactor = Math.max(0, Math.min(1, 1 - dayFactor * 1.45));

  let label: DayNightState["label"] = "Midnight";
  let emoji = "🌙";
  if (p >= 0.16 && p < 0.34) {
    label = "Dawn";
    emoji = "🌅";
  } else if (p >= 0.34 && p < 0.68) {
    label = "Daylight";
    emoji = "☀️";
  } else if (p >= 0.68 && p < 0.86) {
    label = "Dusk";
    emoji = "🌇";
  }

  const baseSky = lerpHex(0x161932, 0x3b4d78, dayFactor);
  const skyTintHex = lerpHex(baseSky, 0x3d2842, twilightFactor * 0.45);
  const baseDir = lerpHex(0xaabbe8, 0xfff1d6, dayFactor);
  const dirColorHex = lerpHex(baseDir, 0xffaa66, twilightFactor * 0.55);

  return {
    phase: p,
    label,
    emoji,
    lanternFactor,
    ambientIntensity: lerp(0.95, 1.35, dayFactor),
    dirIntensity: lerp(1.75, 2.25, dayFactor),
    dirColorHex,
    skyTintHex,
    sunHeight: lerp(34, 46, dayFactor),
  };
}
