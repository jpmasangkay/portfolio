import { describe, expect, it, vi } from "vitest";
import {
  loadLowGraphicsFlag,
  LOW_GRAPHICS_STORAGE_KEY,
  QUALITY_PROFILES,
  QualityMonitor,
  saveLowGraphicsFlag,
} from "./quality-tier";

describe("quality-tier", () => {
  it("drops quality in order: rain, shadow resolution, dynamic lights, render resolution", () => {
    const monitor = new QualityMonitor();
    expect(monitor.getProfile()).toMatchObject({
      tier: 0,
      rainEnabled: true,
      shadowMapSize: 1024,
      dynamicLightsEnabled: true,
      resolutionScale: 1.0,
    });

    const feedSlowWindow = () => {
      for (let i = 0; i < 120; i++) {
        const res = monitor.recordFrame(50);
        if (res !== null) return res;
      }
      return null;
    };

    expect(feedSlowWindow()).toBe(1);
    expect(QUALITY_PROFILES[1]).toMatchObject({
      rainEnabled: false,
      shadowMapSize: 1024,
      dynamicLightsEnabled: true,
      resolutionScale: 1.0,
    });

    expect(feedSlowWindow()).toBe(2);
    expect(QUALITY_PROFILES[2]).toMatchObject({
      rainEnabled: false,
      shadowMapSize: 512,
      dynamicLightsEnabled: true,
      resolutionScale: 1.0,
    });

    expect(feedSlowWindow()).toBe(3);
    expect(QUALITY_PROFILES[3]).toMatchObject({
      rainEnabled: false,
      shadowMapSize: 512,
      dynamicLightsEnabled: false,
      resolutionScale: 1.0,
    });

    expect(feedSlowWindow()).toBe(4);
    expect(QUALITY_PROFILES[4]).toMatchObject({
      rainEnabled: false,
      shadowMapSize: 512,
      dynamicLightsEnabled: false,
      resolutionScale: 0.65,
    });

    expect(feedSlowWindow()).toBeNull();
    expect(monitor.getTier()).toBe(4);
  });

  it("recovers slowly after sustained good frames and stays hysteresis-stable in deadband", () => {
    const monitor = new QualityMonitor();
    // Drop down to tier 2
    for (let i = 0; i < 200 && monitor.getTier() < 2; i++) {
      monitor.recordFrame(50);
    }
    expect(monitor.getTier()).toBe(2);

    // 3 seconds of 16ms frames must NOT yet recover (recovery requires 6s delay)
    for (let i = 0; i < 180; i++) {
      expect(monitor.recordFrame(16.6)).toBeNull();
    }
    expect(monitor.getTier()).toBe(2);

    // Continuing smooth 16ms frames past ~6.5s recovers 2 -> 1
    let recovered: number | null = null;
    for (let i = 0; i < 300; i++) {
      const res = monitor.recordFrame(16.6);
      if (res !== null) {
        recovered = res;
        break;
      }
    }
    expect(recovered).toBe(1);

    // Deadband frames (30ms) right after recovery must not bounce back down to 2
    for (let i = 0; i < 200; i++) {
      expect(monitor.recordFrame(30)).toBeNull();
    }
    expect(monitor.getTier()).toBe(1);
  });

  it("ignores one-off stalls, resize/modal suppress windows, and transient spikes", () => {
    const monitor = new QualityMonitor();
    // Single 1500ms tab-wakeup stall or 220ms GC spike must be ignored
    expect(monitor.recordFrame(1500)).toBeNull();
    expect(monitor.recordFrame(220)).toBeNull();

    // Suppress window (e.g. resize / modal close) ignores elevated 90ms jitter during grace period
    monitor.suppressFor(0.8);
    for (let i = 0; i < 15; i++) {
      expect(monitor.recordFrame(90)).toBeNull();
    }
    expect(monitor.getTier()).toBe(0);

    // Brief 60ms spike followed by smooth frames never downgrades
    monitor.recordFrame(60);
    monitor.recordFrame(60);
    for (let i = 0; i < 60; i++) {
      expect(monitor.recordFrame(16.6)).toBeNull();
    }
    expect(monitor.getTier()).toBe(0);
  });

  it("saves and loads Low graphics flag safely and survives throwing localStorage", () => {
    window.localStorage.clear();
    expect(loadLowGraphicsFlag()).toBe(false);
    saveLowGraphicsFlag(true);
    expect(window.localStorage.getItem(LOW_GRAPHICS_STORAGE_KEY)).toBe("1");
    expect(loadLowGraphicsFlag()).toBe(true);
    saveLowGraphicsFlag(false);
    expect(loadLowGraphicsFlag()).toBe(false);

    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Private mode", "SecurityError");
    });
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Private mode", "SecurityError");
    });
    expect(() => saveLowGraphicsFlag(true)).not.toThrow();
    expect(loadLowGraphicsFlag()).toBe(false);
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
