import { describe, expect, it } from "vitest";
import { detectPlayerZone, getGroundElevation, ZONE_METADATA } from "./town-zones";
import { VILLAGERS } from "@/data/villagers";

describe("town-zones and villagers", () => {
  it("detects town and all three outskirt zones cleanly", () => {
    expect(detectPlayerZone(0, 7)).toBe("town");
    expect(detectPlayerZone(-24, 5)).toBe("forest");
    expect(detectPlayerZone(25, 0)).toBe("lakeside");
    expect(detectPlayerZone(0, -25)).toBe("ruins");
    expect(Object.keys(ZONE_METADATA)).toEqual(["town", "forest", "lakeside", "ruins"]);
  });

  it("ramps elevation smoothly up to the ruined hilltop only along the central stairs", () => {
    expect(getGroundElevation(0, 0)).toBe(0);
    expect(getGroundElevation(0, -20.5)).toBeCloseTo(0.3, 4);
    expect(getGroundElevation(6, -20.5)).toBe(0);
    expect(getGroundElevation(0, -25)).toBe(0.6);
  });

  it("defines 8 villagers including 1 greeter, each with 3 dialogue lines", () => {
    expect(VILLAGERS.length).toBe(8);
    expect(VILLAGERS.filter((v) => v.isGreeter)).toHaveLength(1);
    for (const v of VILLAGERS) {
      expect(v.lines).toHaveLength(3);
      expect(v.lines.every((l) => l.trim().length > 10)).toBe(true);
    }
  });
});
