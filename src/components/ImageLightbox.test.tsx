import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ImageLightbox from "./ImageLightbox";

describe("ImageLightbox", () => {
  it("opens, navigates between images, and closes via button", () => {
    // jsdom doesn't implement showModal/close natively on HTMLDialogElement
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    });

    const onChangeIndex = vi.fn();
    const items = [
      { src: "/a.png", alt: "Poster A", title: "Poster A", description: "Desc A" },
      { src: "/b.png", alt: "Poster B", title: "Poster B", description: "Desc B" },
    ];

    render(<ImageLightbox items={items} activeIndex={0} onChangeIndex={onChangeIndex} />);
    expect(screen.getByText(/Poster A \(1\/2\)/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(onChangeIndex).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: /Close image preview/i }));
    expect(onChangeIndex).toHaveBeenCalledWith(null);
  });
});
