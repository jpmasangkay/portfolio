import { describe, expect, it } from "vitest";
import {
  clampDeltaSec,
  computeOrthoFrustum,
  expDampingAlpha,
  isPositionBlocked,
  MAX_FRAME_DELTA_SEC,
  resolvePlayerStep,
  type ColliderBox,
} from "./town-physics";

describe("town-physics", () => {
  it("clamps large frame deltas to MAX_FRAME_DELTA_SEC and ignores negative values", () => {
    expect(clampDeltaSec(-10)).toBe(0);
    expect(clampDeltaSec(16.67)).toBeCloseTo(0.01667, 5);
    expect(clampDeltaSec(500)).toBe(MAX_FRAME_DELTA_SEC);
  });

  it("produces frame-rate independent movement distance over equal wall time", () => {
    const colliders: ColliderBox[] = [];
    // Simulate 1 second at 60 FPS (60 steps of 1/60s)
    let pos60 = { x: 0, z: 11.5 };
    for (let i = 0; i < 60; i++) {
      const next = resolvePlayerStep(pos60, 0, -1, 1 / 60, colliders);
      pos60 = { x: next.x, z: next.z };
    }

    // Simulate 1 second at 144 FPS (144 steps of 1/144s)
    let pos144 = { x: 0, z: 11.5 };
    for (let i = 0; i < 144; i++) {
      const next = resolvePlayerStep(pos144, 0, -1, 1 / 144, colliders);
      pos144 = { x: next.x, z: next.z };
    }

    expect(pos60.z).toBeCloseTo(11.5 - 7.2, 4);
    expect(pos144.z).toBeCloseTo(pos60.z, 4);
  });

  it("produces consistent exponential damping regardless of frame subdivision", () => {
    let v30 = 0;
    for (let i = 0; i < 30; i++) {
      v30 += (10 - v30) * expDampingAlpha(5, 1 / 30);
    }
    let v120 = 0;
    for (let i = 0; i < 120; i++) {
      v120 += (10 - v120) * expDampingAlpha(5, 1 / 120);
    }
    expect(v30).toBeCloseTo(v120, 5);
  });

  it("blocks colliders while allowing walkable gate archway and pond bridge", () => {
    const colliders: ColliderBox[] = [
      // Open gate piers
      { minX: -4.2, maxX: -1.35, minZ: 12.8, maxZ: 15.2, label: "gate-left" },
      { minX: 1.35, maxX: 4.2, minZ: 12.8, maxZ: 15.2, label: "gate-right" },
      // Pond banks flanking bridge at x=5
      { minX: 2.9, maxX: 4.15, minZ: -7.0, maxZ: -3.0, label: "pond-west" },
      { minX: 5.85, maxX: 8.2, minZ: -7.0, maxZ: -3.0, label: "pond-east" },
      // Fountain
      { minX: -5.0, maxX: -2.0, minZ: -5.0, maxZ: -2.0, label: "fountain" },
    ];

    // Spawn at (0, 7.0) and walking through gate at (0, 14) should be clear
    expect(isPositionBlocked(0, 7.0, colliders)).toBe(false);
    expect(isPositionBlocked(0, 14, colliders)).toBe(false);
    // Gate pier is blocked
    expect(isPositionBlocked(-2.5, 14, colliders)).toBe(true);
    // Bridge at x=5, z=-5 is walkable, pond banks are blocked
    expect(isPositionBlocked(5, -5, colliders)).toBe(false);
    expect(isPositionBlocked(3.5, -5, colliders)).toBe(true);
    expect(isPositionBlocked(6.8, -5, colliders)).toBe(true);
    // Fountain center is blocked
    expect(isPositionBlocked(-3.5, -3.5, colliders)).toBe(true);
  });

  it("widens portrait orthographic frustum so horizontal town view stays readable", () => {
    const desktop = computeOrthoFrustum(1920, 1080, 12);
    expect(desktop.top).toBe(12);
    expect(desktop.right).toBeCloseTo(21.333, 2);

    const portrait = computeOrthoFrustum(390, 844, 12);
    expect(portrait.top).toBeGreaterThan(18);
    expect(portrait.right).toBeGreaterThan(9);
  });
});
