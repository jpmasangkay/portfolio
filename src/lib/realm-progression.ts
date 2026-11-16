import type { BuildingId } from "@/data/portfolio-data";
import type { ZoneId } from "@/lib/town-zones";

export type InteriorId = "tavern" | "wizard";

export interface SecretFindDef {
  id: string;
  name: string;
  emoji: string;
  zone: ZoneId;
  x: number;
  y: number;
  z: number;
  hint: string;
  lore: string;
}

export const SECRET_FINDS: SecretFindDef[] = [
  {
    id: "tavern-coin",
    name: "Lucky Gold Coin",
    emoji: "🪙",
    zone: "town",
    x: -11.4,
    y: 0.35,
    z: 9.2,
    hint: "Glinting quietly behind The Tavern's western timber wall",
    lore: "An old guild florin stamped with the motto: Ship early, polish often.",
  },
  {
    id: "stray-cat",
    name: "Stray Tuxedo Cat",
    emoji: "🐈",
    zone: "town",
    x: 11.6,
    y: 0.0,
    z: -1.8,
    hint: "Curled peacefully behind The Gallery steps",
    lore: "The local studio mascot approves of clean spacing and hairline borders.",
  },
  {
    id: "forest-shard",
    name: "Whispering Crystal",
    emoji: "🔮",
    zone: "forest",
    x: -26.8,
    y: 0.4,
    z: 6.8,
    hint: "Glowing in the Whispering Forest toadstool clearing",
    lore: "A luminescent shard attuned to TypeScript strict mode.",
  },
  {
    id: "lakeside-bottle",
    name: "Message in a Bottle",
    emoji: "🍾",
    zone: "lakeside",
    x: 29.8,
    y: 0.25,
    z: 1.4,
    hint: "Resting at the tip of the Moonlit Lakeside dock",
    lore: "Inside reads a note: 'Thanks for exploring every corner of the realm!'",
  },
  {
    id: "ruins-chest",
    name: "Ancient Ruins Chest",
    emoji: "🏺",
    zone: "ruins",
    x: 2.8,
    y: 0.6,
    z: -30.8,
    hint: "Hidden beside the northern Ruined Hilltop altar",
    lore: "A weathered coffer containing early sketches of voxel towns and dungeon grids.",
  },
];

export const XP_WEIGHTS = {
  building: 100,
  villager: 25,
  outskirtZone: 50,
  secret: 75,
} as const;

export interface LevelThreshold {
  level: number;
  minXp: number;
  title: string;
}

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, minXp: 0, title: "Novice Wanderer" },
  { level: 2, minXp: 150, title: "Town Seeker" },
  { level: 3, minXp: 350, title: "Guild Ranger" },
  { level: 4, minXp: 600, title: "Arcane Scholar" },
  { level: 5, minXp: 900, title: "Realm Chronicler" },
  { level: 6, minXp: 1250, title: "Grand Archmage" },
];

export interface ProgressionInput {
  visitedBuildingsCount: number;
  talkedVillagersCount: number;
  visitedZones: ReadonlySet<ZoneId>;
  foundSecretsCount: number;
}

export interface PlayerProgression {
  xp: number;
  level: number;
  title: string;
  currentLevelFloorXp: number;
  nextLevelXp: number | null;
  progressPct: number;
  maxPossibleXp: number;
}

/**
 * Compute XP, level, title, and bar percentage from visited landmarks, villagers,
 * outskirt zones, and collected secrets.
 */
export function computePlayerProgression(input: ProgressionInput): PlayerProgression {
  const outskirtCount = ["forest", "lakeside", "ruins"].filter((z) =>
    input.visitedZones.has(z as ZoneId)
  ).length;

  const xp =
    Math.max(0, input.visitedBuildingsCount) * XP_WEIGHTS.building +
    Math.max(0, input.talkedVillagersCount) * XP_WEIGHTS.villager +
    outskirtCount * XP_WEIGHTS.outskirtZone +
    Math.max(0, input.foundSecretsCount) * XP_WEIGHTS.secret;

  let current = LEVEL_THRESHOLDS[0];
  let next: LevelThreshold | null = LEVEL_THRESHOLDS[1] ?? null;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].minXp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] ?? null;
    }
  }

  const progressPct = next
    ? Math.min(
        100,
        Math.max(0, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100))
      )
    : 100;

  return {
    xp,
    level: current.level,
    title: current.title,
    currentLevelFloorXp: current.minXp,
    nextLevelXp: next ? next.minXp : null,
    progressPct,
    maxPossibleXp:
      8 * XP_WEIGHTS.building +
      8 * XP_WEIGHTS.villager +
      3 * XP_WEIGHTS.outskirtZone +
      SECRET_FINDS.length * XP_WEIGHTS.secret,
  };
}

export const WALKIN_BUILDINGS: ReadonlySet<BuildingId> = new Set(["tavern", "wizard"]);
