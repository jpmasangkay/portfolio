export type ZoneId = "town" | "forest" | "lakeside" | "ruins";

export interface ZoneMeta {
  id: ZoneId;
  name: string;
  emoji: string;
  subtitle: string;
  fogColorHex: number;
  skyColorHex: number;
}

export const ZONE_METADATA: Record<ZoneId, ZoneMeta> = {
  town: {
    id: "town",
    name: "Town Square",
    emoji: "🏘️",
    subtitle: "8 portfolio landmarks & townfolk",
    fogColorHex: 0x161932,
    skyColorHex: 0x161932,
  },
  forest: {
    id: "forest",
    name: "Whispering Forest",
    emoji: "🌲",
    subtitle: "Firefly woods & hidden clearing",
    fogColorHex: 0x102325,
    skyColorHex: 0x102026,
  },
  lakeside: {
    id: "lakeside",
    name: "Moonlit Lakeside",
    emoji: "🌊",
    subtitle: "Wooden dock & moored rowboat",
    fogColorHex: 0x111d38,
    skyColorHex: 0x121b34,
  },
  ruins: {
    id: "ruins",
    name: "Ruined Hilltop",
    emoji: "🏚️",
    subtitle: "Ancient lookout & hilltop campfire",
    fogColorHex: 0x1c1932,
    skyColorHex: 0x19172e,
  },
};

export const EXPANDED_WORLD_BOUNDS = {
  minX: -35,
  maxX: 35,
  minZ: -33,
  maxZ: 21,
};

/**
 * Determine which realm zone a world coordinate (x, z) belongs to.
 */
export function detectPlayerZone(x: number, z: number): ZoneId {
  if (x < -18.5) return "forest";
  if (x > 18.5) return "lakeside";
  if (z < -16.5) return "ruins";
  return "town";
}

/**
 * Return smooth ground elevation Y for a given world coordinate (x, z)
 * so the Ruined Hilltop plateau rises gently up the northern steps.
 */
export function getGroundElevation(x: number, z: number): number {
  if (z >= -18.5 || Math.abs(x) > 13.5) return 0;
  if (z <= -22.5) return 0.6;
  // Ramp smoothly only along the central stone staircase so flanking slopes stay at ground level
  if (Math.abs(x) > 2.2) return 0;
  // Linear ramp from z=-18.5 (y=0) to z=-22.5 (y=0.6)
  const t = (-18.5 - z) / 4.0;
  return Math.max(0, Math.min(0.6, t * 0.6));
}
