import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MobileThumbstick from "./MobileThumbstick";
import { computeThumbstickVector, mobileInput, setMobileDir } from "@/lib/mobile-input";

describe("MobileThumbstick", () => {
  beforeEach(() => {
    setMobileDir(0, 0);
    if (typeof globalThis.PointerEvent === "undefined") {
      vi.stubGlobal("PointerEvent", MouseEvent);
    }
  });

  it("clamps displacement and respects deadzone", () => {
    expect(computeThumbstickVector(2, 0)).toEqual({ kx: 2, ky: 0, dx: 0, dz: 0 });
    const fullRight = computeThumbstickVector(100, 0);
    expect(fullRight.kx).toBeCloseTo(36, 4);
    expect(fullRight.dx).toBeCloseTo(1, 4);
    expect(fullRight.dz).toBeCloseTo(0, 4);
  });

  it("updates mobileInput on pointer drag and resets on pointer up", () => {
    render(<MobileThumbstick />);
    const pad = screen.getByRole("application", { name: /Virtual movement thumbstick/i });
    pad.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      right: 112,
      bottom: 112,
      width: 112,
      height: 112,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    fireEvent.pointerDown(pad, { pointerId: 1, clientX: 56, clientY: 56 });
    fireEvent.pointerMove(pad, { pointerId: 1, clientX: 56, clientY: 20 });
    expect(mobileInput.dz).toBeLessThan(-0.8);

    fireEvent.pointerUp(pad, { pointerId: 1, clientX: 56, clientY: 20 });
    expect(mobileInput.dx).toBe(0);
    expect(mobileInput.dz).toBe(0);
  });
});
