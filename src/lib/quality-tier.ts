export type QualityTier = 0 | 1 | 2 | 3 | 4;

export interface QualityProfile {
  tier: QualityTier;
  label: string;
  rainEnabled: boolean;
  shadowMapSize: 1024 | 512;
  dynamicLightsEnabled: boolean;
  resolutionScale: number;
}

/** Frame-time EMA threshold (ms) above which sustained lag degrades quality. */
export const HIGH_FRAME_TIME_MS = 38;
/** Sustained duration (seconds) of high frame times before dropping one tier. */
export const SUSTAINED_LAG_SEC = 2.8;
/** LocalStorage key persisting user preference for explicit Low graphics mode. */
export const LOW_GRAPHICS_STORAGE_KEY = "shealtiel_low_graphics_v1";

/** Progressive degradation order: 0 Full -> 1 No Rain -> 2 Low Shadows -> 3 No Dynamic Lights -> 4 Low Render Resolution. */
export const QUALITY_PROFILES: Record<QualityTier, QualityProfile> = {
  0: {
    tier: 0,
    label: "Full",
    rainEnabled: true,
    shadowMapSize: 1024,
    dynamicLightsEnabled: true,
    resolutionScale: 1.0,
  },
  1: {
    tier: 1,
    label: "No Rain",
    rainEnabled: false,
    shadowMapSize: 1024,
    dynamicLightsEnabled: true,
    resolutionScale: 1.0,
  },
  2: {
    tier: 2,
    label: "Low Shadows",
    rainEnabled: false,
    shadowMapSize: 512,
    dynamicLightsEnabled: true,
    resolutionScale: 1.0,
  },
  3: {
    tier: 3,
    label: "Static Lights",
    rainEnabled: false,
    shadowMapSize: 512,
    dynamicLightsEnabled: false,
    resolutionScale: 1.0,
  },
  4: {
    tier: 4,
    label: "Low",
    rainEnabled: false,
    shadowMapSize: 512,
    dynamicLightsEnabled: false,
    resolutionScale: 0.65,
  },
};

/**
 * Tracks smoothed frame times and steps quality down one tier at a time
 * when average frame time remains above threshold for SUSTAINED_LAG_SEC.
 */
export class QualityMonitor {
  private tier: QualityTier = 0;
  private emaFrameMs = 16.7;
  private lagAccumSec = 0;

  getTier(): QualityTier {
    return this.tier;
  }

  getProfile(): QualityProfile {
    return QUALITY_PROFILES[this.tier];
  }

  /**
   * Record a real frame wall-clock delta in ms.
   * Returns the new QualityTier if degraded, or null if unchanged.
   */
  recordFrame(rawFrameMs: number): QualityTier | null {
    // Ignore invalid stalls (e.g. tab backgrounded) so transient wakeups do not degrade quality.
    if (!Number.isFinite(rawFrameMs) || rawFrameMs <= 0 || rawFrameMs > 250) {
      return null;
    }

    const dtSec = rawFrameMs / 1000;
    const alpha = 1 - Math.exp(-dtSec * 2.5);
    this.emaFrameMs = this.emaFrameMs * (1 - alpha) + rawFrameMs * alpha;

    if (this.tier >= 4) {
      return null;
    }

    if (this.emaFrameMs > HIGH_FRAME_TIME_MS) {
      this.lagAccumSec += dtSec;
      if (this.lagAccumSec >= SUSTAINED_LAG_SEC) {
        this.tier = (this.tier + 1) as QualityTier;
        this.lagAccumSec = 0;
        // Re-seed EMA below threshold so the new tier gets a clean observation window before another drop.
        this.emaFrameMs = HIGH_FRAME_TIME_MS * 0.85;
        return this.tier;
      }
    } else {
      this.lagAccumSec = Math.max(0, this.lagAccumSec - dtSec * 1.5);
    }

    return null;
  }

  reset(): void {
    this.tier = 0;
    this.emaFrameMs = 16.7;
    this.lagAccumSec = 0;
  }
}

/** Read Low graphics toggle safely even when localStorage throws (private mode). */
export function loadLowGraphicsFlag(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LOW_GRAPHICS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist Low graphics toggle safely without throwing on quota/private-mode errors. */
export function saveLowGraphicsFlag(enabled: boolean): void {
  try {
    if (typeof window === "undefined") return;
    if (enabled) {
      window.localStorage.setItem(LOW_GRAPHICS_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(LOW_GRAPHICS_STORAGE_KEY);
    }
  } catch {
    // Private browsing or blocked storage — runtime toggle still works cleanly
  }
}
