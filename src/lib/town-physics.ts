export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  label?: string;
}

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const PLAYER_RADIUS = 0.6;
export const MOVE_SPEED_PER_SEC = 7.2;
export const WALK_CYCLE_RAD_PER_SEC = 10.8;
export const CAMERA_SMOOTH_RATE = 5.0;
export const MAX_FRAME_DELTA_SEC = 0.05;

/**
 * Compute orthographic camera frustum half-extents, zooming out gracefully on
 * portrait viewports so horizontal world visibility remains generous.
 */
export function computeOrthoFrustum(
  width: number,
  height: number,
  baseCamSize: number = 12
): { left: number; right: number; top: number; bottom: number; halfHeight: number } {
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const aspect = safeW / safeH;
  const halfHeight = aspect < 1 ? Math.min(20, 9.2 / aspect) : baseCamSize;
  const halfWidth = halfHeight * aspect;
  return {
    left: -halfWidth,
    right: halfWidth,
    top: halfHeight,
    bottom: -halfHeight,
    halfHeight,
  };
}

export const DEFAULT_WORLD_BOUNDS: WorldBounds = {
  minX: -19,
  maxX: 19,
  minZ: -17,
  maxZ: 19,
};

/**
 * Clamp a frame delta in milliseconds into seconds (max MAX_FRAME_DELTA_SEC)
 * so tab switches or frame stalls cannot tunnel the player through colliders.
 */
export function clampDeltaSec(deltaMs: number): number {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return 0;
  return Math.min(deltaMs / 1000, MAX_FRAME_DELTA_SEC);
}

/**
 * Compute frame-rate independent exponential smoothing factor: 1 - exp(-rate * dt).
 */
export function expDampingAlpha(ratePerSec: number, dt: number): number {
  if (dt <= 0) return 0;
  return 1 - Math.exp(-ratePerSec * dt);
}

/**
 * Test whether a circle-approximated player footprint (radius) overlaps any AABB collider or leaves world bounds.
 */
export function isPositionBlocked(
  x: number,
  z: number,
  colliders: readonly ColliderBox[],
  radius: number = PLAYER_RADIUS,
  worldBounds: WorldBounds = DEFAULT_WORLD_BOUNDS
): boolean {
  for (const b of colliders) {
    if (
      x + radius > b.minX &&
      x - radius < b.maxX &&
      z + radius > b.minZ &&
      z - radius < b.maxZ
    ) {
      return true;
    }
  }
  if (
    x < worldBounds.minX ||
    x > worldBounds.maxX ||
    z > worldBounds.maxZ ||
    z < worldBounds.minZ
  ) {
    return true;
  }
  return false;
}

/**
 * Advance player position by normalized input (inputX, inputZ) over dt seconds with axis-separated sliding collision.
 */
export function resolvePlayerStep(
  pos: { x: number; z: number },
  inputX: number,
  inputZ: number,
  dt: number,
  colliders: readonly ColliderBox[],
  speedPerSec: number = MOVE_SPEED_PER_SEC,
  radius: number = PLAYER_RADIUS,
  worldBounds: WorldBounds = DEFAULT_WORLD_BOUNDS
): { x: number; z: number; moved: boolean; moveDx: number; moveDz: number } {
  if ((inputX === 0 && inputZ === 0) || dt <= 0) {
    return { x: pos.x, z: pos.z, moved: false, moveDx: 0, moveDz: 0 };
  }
  const len = Math.hypot(inputX, inputZ);
  const stepX = (inputX / len) * speedPerSec * dt;
  const stepZ = (inputZ / len) * speedPerSec * dt;

  let nextX = pos.x;
  let nextZ = pos.z;

  if (!isPositionBlocked(pos.x + stepX, nextZ, colliders, radius, worldBounds)) {
    nextX = pos.x + stepX;
  }
  if (!isPositionBlocked(nextX, pos.z + stepZ, colliders, radius, worldBounds)) {
    nextZ = pos.z + stepZ;
  }

  return {
    x: nextX,
    z: nextZ,
    moved: true,
    moveDx: stepX,
    moveDz: stepZ,
  };
}
