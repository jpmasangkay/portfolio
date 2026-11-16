import type { ZoneId } from "@/lib/town-zones";
import type { InteriorId } from "@/lib/realm-progression";

const AUDIO_MUTED_KEY = "shealtiel_audio_muted_v1";

type MuteListener = (muted: boolean) => void;
const muteListeners = new Set<MuteListener>();

let currentMuted = true;

try {
  const stored = localStorage.getItem(AUDIO_MUTED_KEY);
  // Default muted until visitor explicitly enables sound so audio never auto-blasts
  currentMuted = stored === "0" ? false : true;
} catch {
  currentMuted = true;
}

export function isAudioMuted(): boolean {
  return currentMuted;
}

export function setAudioMuted(muted: boolean): void {
  currentMuted = muted;
  try {
    localStorage.setItem(AUDIO_MUTED_KEY, muted ? "1" : "0");
  } catch {
    // Ignore storage write errors
  }
  muteListeners.forEach((cb) => cb(muted));
}

export function subscribeAudioMuted(cb: MuteListener): () => void {
  muteListeners.add(cb);
  return () => {
    muteListeners.delete(cb);
  };
}

/**
 * Lightweight Web Audio API zone ambience controller (crickets, shoreline water, wind)
 * that respects global audio mute and runs zero timers while muted.
 */
export class ZoneAmbienceController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;
  private pulseTimer: number | null = null;
  private activeZone: ZoneId = "town";
  private activeInterior: InteriorId | null = null;
  private muted = true;
  private disposed = false;

  public setContextState(muted: boolean, zone: ZoneId, interior: InteriorId | null): void {
    this.muted = muted;
    this.activeZone = zone;
    this.activeInterior = interior;
    if (this.disposed) return;

    if (muted) {
      this.stopPulse();
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      return;
    }

    this.ensureContext();
    if (!this.ctx || !this.masterGain || !this.noiseFilter || !this.noiseGain) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    this.masterGain.gain.setTargetAtTime(0.055, this.ctx.currentTime, 0.25);

    if (interior) {
      this.noiseFilter.frequency.setTargetAtTime(interior === "tavern" ? 260 : 420, this.ctx.currentTime, 0.3);
      this.noiseGain.gain.setTargetAtTime(0.18, this.ctx.currentTime, 0.3);
      this.stopPulse();
    } else if (zone === "lakeside") {
      // Soft rolling lake water waves
      this.noiseFilter.type = "lowpass";
      this.noiseFilter.frequency.setTargetAtTime(480, this.ctx.currentTime, 0.3);
      this.noiseGain.gain.setTargetAtTime(0.42, this.ctx.currentTime, 0.3);
      this.stopPulse();
    } else if (zone === "ruins") {
      // High-altitude breeze
      this.noiseFilter.type = "bandpass";
      this.noiseFilter.frequency.setTargetAtTime(640, this.ctx.currentTime, 0.3);
      this.noiseGain.gain.setTargetAtTime(0.32, this.ctx.currentTime, 0.3);
      this.ensurePulse();
    } else {
      // Town & forest gentle night crickets
      this.noiseFilter.type = "lowpass";
      this.noiseFilter.frequency.setTargetAtTime(320, this.ctx.currentTime, 0.3);
      this.noiseGain.gain.setTargetAtTime(zone === "forest" ? 0.22 : 0.14, this.ctx.currentTime, 0.3);
      this.ensurePulse();
    }
  }

  private ensureContext(): void {
    if (this.ctx || typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // 2-second procedural pink-ish noise buffer
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 340;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.15;

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start();

    this.ctx = ctx;
    this.masterGain = masterGain;
    this.noiseSource = noiseSource;
    this.noiseFilter = noiseFilter;
    this.noiseGain = noiseGain;
  }

  private ensurePulse(): void {
    if (this.pulseTimer !== null || typeof window === "undefined") return;
    this.pulseTimer = window.setInterval(() => {
      if (this.muted || this.disposed || !this.ctx || !this.masterGain || this.activeInterior) {
        return;
      }
      if (this.activeZone === "town" || this.activeZone === "forest") {
        // Delicate cricket chirp
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(this.activeZone === "forest" ? 3900 : 3500, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.14, now + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (this.activeZone === "ruins") {
        // Warm campfire ember crackle pop
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(160 + Math.random() * 140, now);
        g.gain.setValueAtTime(0.001, now);
        g.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    }, 1800);
  }

  private stopPulse(): void {
    if (this.pulseTimer !== null && typeof window !== "undefined") {
      window.clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }
  }

  public dispose(): void {
    this.disposed = true;
    this.stopPulse();
    try {
      this.noiseSource?.stop();
      this.ctx?.close().catch(() => {});
    } catch {
      // Ignore cleanup errors
    }
    this.ctx = null;
    this.masterGain = null;
    this.noiseSource = null;
    this.noiseFilter = null;
    this.noiseGain = null;
  }
}
