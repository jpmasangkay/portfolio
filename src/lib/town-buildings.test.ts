import { describe, expect, it } from "vitest";
import {
  TOWN_BUILDINGS_LAYOUT,
  findNearestUnvisitedBuilding,
  getIsoDirectionToTarget,
} from "./town-buildings";
import type { BuildingId } from "@/data/portfolio-data";

describe("town-buildings", () => {
  it("computes isometric screen-space direction angles accurately", () => {
    // Screen UP = world (-1, -1) -> angleDeg ~ 0
    expect(getIsoDirectionToTarget(0, 0, -5, -5).angleDeg).toBeCloseTo(0, 4);
    // Screen RIGHT = world (+1, -1) -> angleDeg ~ +90
    expect(getIsoDirectionToTarget(0, 0, 5, -5).angleDeg).toBeCloseTo(90, 4);
    // Screen LEFT = world (-1, +1) -> angleDeg ~ -90
    expect(getIsoDirectionToTarget(0, 0, -5, 5).angleDeg).toBeCloseTo(-90, 4);
  });

  it("finds nearest unvisited building and returns null when all 8 are visited", () => {
    const visited = new Set<BuildingId>(["questboard"]);
    const nearest = findNearestUnvisitedBuilding(0, 7, visited);
    // Tavern (-8, 8) dist = sqrt(65)=8.06, Notice (8, 8) dist = sqrt(65)=8.06, Gate (0, 14) dist = 7
    expect(nearest?.building.id).toBe("gate");

    const allVisited = new Set<BuildingId>(TOWN_BUILDINGS_LAYOUT.map((b) => b.id));
    expect(findNearestUnvisitedBuilding(0, 7, allVisited)).toBeNull();
  });
});
