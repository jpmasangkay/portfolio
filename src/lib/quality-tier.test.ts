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

    // Helper to feed slow 50ms frames until one tier transition triggers (up to 4s)
    const feedSlowWindow = () => {
      for (let i = 0; i < 90; i++) {
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

    // Further slow frames stay at tier 4
    expect(feedSlowWindow()).toBeNull();
    expect(monitor.getTier()).toBe(4);
  });

  it("ignores huge tab-resume stalls and transient single-frame spikes", () => {
    const monitor = new QualityMonitor();
    // Single 1500ms wakeup stall must be ignored
    expect(monitor.recordFrame(1500)).toBeNull();
    // Two brief 60ms spikes followed by smooth 16ms frames must stay at tier 0
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
