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
