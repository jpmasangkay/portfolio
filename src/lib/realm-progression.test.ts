import { describe, expect, it } from "vitest";
import { computePlayerProgression, SECRET_FINDS } from "./realm-progression";
import { computeDayNightState } from "./day-night";
import { isAudioMuted, setAudioMuted, subscribeAudioMuted } from "./sound-engine";

describe("realm progression, secrets, day/night & audio sync", () => {
  it("computes XP and levels accurately from landmarks, villagers, zones, and secrets", () => {
    const start = computePlayerProgression({
      visitedBuildingsCount: 0,
      talkedVillagersCount: 0,
      visitedZones: new Set(["town"]),
      foundSecretsCount: 0,
    });
    expect(start.xp).toBe(0);
    expect(start.level).toBe(1);
    expect(start.nextLevelXp).toBe(150);

    const mid = computePlayerProgression({
      visitedBuildingsCount: 3, // 300
      talkedVillagersCount: 2, // 50
      visitedZones: new Set(["town", "forest", "lakeside"]), // 100
      foundSecretsCount: 1, // 75 => total 525 (Level 3: 350..600)
    });
    expect(mid.xp).toBe(525);
    expect(mid.level).toBe(3);
    expect(mid.title).toBe("Guild Ranger");
    expect(mid.progressPct).toBe(70);

    const maxed = computePlayerProgression({
      visitedBuildingsCount: 8,
      talkedVillagersCount: 8,
      visitedZones: new Set(["town", "forest", "lakeside", "ruins"]),
      foundSecretsCount: SECRET_FINDS.length,
    });
    expect(maxed.level).toBe(6);
    expect(maxed.nextLevelXp).toBeNull();
    expect(maxed.progressPct).toBe(100);
    expect(SECRET_FINDS).toHaveLength(5);
  });

  it("computes midnight pinned state vs dynamic day/night phase", () => {
    const pinned = computeDayNightState(0.5, true);
    expect(pinned.label).toBe("Midnight");
    expect(pinned.lanternFactor).toBe(1);

    const midday = computeDayNightState(0.5, false);
    expect(midday.label).toBe("Daylight");
    expect(midday.lanternFactor).toBe(0);
    expect(midday.dirIntensity).toBeGreaterThan(pinned.dirIntensity);

    const dusk = computeDayNightState(0.75, false);
    expect(dusk.label).toBe("Dusk");
    expect(dusk.lanternFactor).toBeGreaterThan(0);
  });

  it("broadcasts audio mute changes across subscribers", () => {
    const events: boolean[] = [];
    const unsub = subscribeAudioMuted((m) => events.push(m));
    setAudioMuted(false);
    expect(isAudioMuted()).toBe(false);
    setAudioMuted(true);
    expect(isAudioMuted()).toBe(true);
    unsub();
    expect(events).toEqual([false, true]);
  });
});
