// Shared mobile input state — module-level singleton
// Both TownOverlay (writes) and TownWorld (reads) access this directly
// No React refs, no callbacks, no closure issues
export const mobileInput = {
  dx: 0,
  dz: 0,
  interact: false,
};

export function setMobileDir(dx: number, dz: number) {
  mobileInput.dx = dx;
  mobileInput.dz = dz;
}

export function triggerMobileInteract() {
  mobileInput.interact = true;
}

export function consumeMobileInteract(): boolean {
  if (mobileInput.interact) {
    mobileInput.interact = false;
    return true;
  }
  return false;
}

export const THUMBSTICK_MAX_RADIUS = 36;
export const THUMBSTICK_DEADZONE = 0.14;

/**
 * Map pointer offset (ox, oy) from thumbstick center into clamped visual knob offset
 * and normalized movement vector.
 */
export function computeThumbstickVector(
  ox: number,
  oy: number,
  maxRadius: number = THUMBSTICK_MAX_RADIUS,
  deadzone: number = THUMBSTICK_DEADZONE
): { kx: number; ky: number; dx: number; dz: number } {
  if (!Number.isFinite(ox) || !Number.isFinite(oy)) {
    return { kx: 0, ky: 0, dx: 0, dz: 0 };
  }
  const dist = Math.hypot(ox, oy);
  if (dist === 0) {
    return { kx: 0, ky: 0, dx: 0, dz: 0 };
  }
  const clampedDist = Math.min(dist, maxRadius);
  const kx = (ox / dist) * clampedDist;
  const ky = (oy / dist) * clampedDist;
  const norm = clampedDist / maxRadius;
  if (norm < deadzone) {
    return { kx, ky, dx: 0, dz: 0 };
  }
  const scaled = (norm - deadzone) / (1 - deadzone);
  return {
    kx,
    ky,
    dx: (ox / dist) * scaled,
    dz: (oy / dist) * scaled,
  };
}
