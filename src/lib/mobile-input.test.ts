import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeMobileInteract,
  mobileInput,
  setMobileDir,
  triggerMobileInteract,
} from "./mobile-input";

describe("mobile-input", () => {
  beforeEach(() => {
    setMobileDir(0, 0);
    mobileInput.interact = false;
  });

  it("updates direction vector via setMobileDir", () => {
    setMobileDir(-0.5, 0.8);
    expect(mobileInput.dx).toBe(-0.5);
    expect(mobileInput.dz).toBe(0.8);
  });

  it("consumes interact trigger exactly once", () => {
    expect(consumeMobileInteract()).toBe(false);

    triggerMobileInteract();
    expect(consumeMobileInteract()).toBe(true);
    expect(consumeMobileInteract()).toBe(false);
  });
});
