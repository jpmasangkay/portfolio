import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ScrollModal from "./ScrollModal";

describe("ScrollModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ScrollModal open={false} onClose={vi.fn()} title="The Tavern" emoji="🍺">
        <p>Inner body</p>
      </ScrollModal>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders ARIA dialog attributes, title, emoji, and children when open and closes cleanly", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ScrollModal open={true} onClose={onClose} title="The Tavern" emoji="🍺">
        <p>Adventurer bio</p>
      </ScrollModal>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(screen.getByText("The Tavern")).toBeInTheDocument();
    expect(screen.getByText("Adventurer bio")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Close The Tavern/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);

    const overlay = container.querySelector(".scroll-modal-overlay")!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
