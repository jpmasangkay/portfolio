import type { BuildingId } from "@/data/portfolio-data";

export interface TownBuildingLayout {
  id: BuildingId;
  shortName: string;
  name: string;
  guideDesc: string;
  emoji: string;
  beaconColorCss: string;
  beaconColorHex: number;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  roofH: number;
  wallColor: number;
  roofColor: number;
  hasWindows?: boolean;
  rotY?: number;
}

export const TOWN_BUILDINGS_LAYOUT: TownBuildingLayout[] = [
  {
    id: "gate",
    shortName: "Gate",
    name: "Town Gate",
    guideDesc: "Welcome",
    emoji: "🏰",
    beaconColorCss: "#ffdd44",
    beaconColorHex: 0xffdd44,
    x: 0,
    z: 14,
    w: 5,
    h: 5,
    d: 2,
    roofH: 2.5,
    wallColor: 0x7a7088,
    roofColor: 0x6a5545,
    hasWindows: false,
  },
  {
    id: "tavern",
    shortName: "Tavern",
    name: "The Tavern",
    guideDesc: "About Me",
    emoji: "🍺",
    beaconColorCss: "#ff8833",
    beaconColorHex: 0xff8833,
    x: -8,
    z: 8,
    w: 5,
    h: 3.5,
    d: 5,
    roofH: 2,
    wallColor: 0x8a6040,
    roofColor: 0xa8622a,
    hasWindows: true,
  },
  {
    id: "questboard",
    shortName: "Quest Board",
    name: "Quest Board",
    guideDesc: "Repos",
    emoji: "📜",
    beaconColorCss: "#44ddff",
    beaconColorHex: 0x44ddff,
    x: 0,
    z: 3,
    w: 2,
    h: 3,
    d: 1,
    roofH: 1,
    wallColor: 0x7a5838,
    roofColor: 0x5a4030,
    hasWindows: false,
  },
  {
    id: "wizard",
    shortName: "Tower",
    name: "Wizard's Tower",
    guideDesc: "Skills",
    emoji: "🧙",
    beaconColorCss: "#aa66ff",
    beaconColorHex: 0xaa66ff,
    x: 0,
    z: -10,
    w: 3.5,
    h: 7,
    d: 3.5,
    roofH: 3,
    wallColor: 0x6a5a8a,
    roofColor: 0x4a3a6a,
    hasWindows: true,
  },
  {
    id: "gallery",
    shortName: "Gallery",
    name: "The Gallery",
    guideDesc: "Artwork",
    emoji: "🎨",
    beaconColorCss: "#ff66aa",
    beaconColorHex: 0xff66aa,
    x: 9,
    z: 0,
    w: 5,
    h: 3,
    d: 4,
    roofH: 1.8,
    wallColor: 0x8a7a68,
    roofColor: 0x9a6a3a,
    hasWindows: true,
  },
  {
    id: "forge",
    shortName: "Forge",
    name: "The Forge",
    guideDesc: "3D Work",
    emoji: "⚒️",
    beaconColorCss: "#ff4422",
    beaconColorHex: 0xff4422,
    x: -9,
    z: -2,
    w: 4,
    h: 3,
    d: 4,
    roofH: 1.5,
    wallColor: 0x6a5858,
    roofColor: 0x5a4030,
    hasWindows: true,
  },
  {
    id: "noticeboard",
    shortName: "Notice",
    name: "Notice Board",
    guideDesc: "Certs",
    emoji: "🏆",
    beaconColorCss: "#44ff66",
    beaconColorHex: 0x44ff66,
    x: 8,
    z: 8,
    w: 2.5,
    h: 2.5,
    d: 2,
    roofH: 1.2,
    wallColor: 0x7a6a58,
    roofColor: 0x8a6a3a,
    hasWindows: false,
  },
  {
    id: "exit",
    shortName: "Exit",
    name: "Town Exit",
    guideDesc: "Contact",
    emoji: "🕊️",
    beaconColorCss: "#ffffff",
    beaconColorHex: 0xffffff,
    x: 10,
    z: -10,
    w: 3,
    h: 4,
    d: 2,
    roofH: 2,
    wallColor: 0x7a7a88,
    roofColor: 0x6a6070,
    hasWindows: false,
  },
];

/**
 * Compute screen-space isometric angle (deg: 0 = up, 90 = right) and distance from player to target.
 */
export function getIsoDirectionToTarget(
  playerX: number,
  playerZ: number,
  targetX: number,
  targetZ: number
): { angleDeg: number; distance: number; screenX: number; screenY: number } {
  const vx = targetX - playerX;
  const vz = targetZ - playerZ;
  const distance = Math.hypot(vx, vz);
  const screenX = (vx - vz) * Math.SQRT1_2;
  const screenY = (vx + vz) * Math.SQRT1_2;
  const angleDeg = Math.atan2(screenX, -screenY) * (180 / Math.PI);
  return { angleDeg, distance, screenX, screenY };
}

/**
 * Find the closest unvisited landmark (building) from the player's current position.
 */
export function findNearestUnvisitedBuilding(
  playerX: number,
  playerZ: number,
  visitedIds: ReadonlySet<BuildingId>,
  buildings: readonly TownBuildingLayout[] = TOWN_BUILDINGS_LAYOUT
): { building: TownBuildingLayout; angleDeg: number; distance: number; screenX: number; screenY: number } | null {
  let best: { building: TownBuildingLayout; angleDeg: number; distance: number; screenX: number; screenY: number } | null = null;
  for (const b of buildings) {
    if (visitedIds.has(b.id)) continue;
    const dir = getIsoDirectionToTarget(playerX, playerZ, b.x, b.z);
    if (!best || dir.distance < best.distance) {
      best = { building: b, ...dir };
    }
  }
  return best;
}
