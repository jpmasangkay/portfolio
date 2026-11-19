import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ScrollModal from "./ScrollModal";
import ImageLightbox from "./ImageLightbox";

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

  it("yields Escape key dismissal when a nested ImageLightbox is open above it", () => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    });

    const onCloseModal = vi.fn();
    const onChangeLightbox = vi.fn();

    render(
      <ScrollModal open={true} onClose={onCloseModal} title="The Gallery" emoji="🎨">
        <ImageLightbox
          items={[{ src: "/poster.webp", alt: "Poster", title: "Tour Poster" }]}
          activeIndex={0}
          onChangeIndex={onChangeLightbox}
        />
      </ScrollModal>
    );

    // Pressing Escape while nested lightbox is open must close only the lightbox, not ScrollModal
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onChangeLightbox).toHaveBeenCalledWith(null);
    expect(onCloseModal).not.toHaveBeenCalled();
  });
});
