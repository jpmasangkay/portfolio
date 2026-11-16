import { useEffect, useId, useRef } from "react";

export interface LightboxImage {
  src: string;
  alt: string;
  title: string;
  description?: string;
}

interface ImageLightboxProps {
  items: LightboxImage[];
  activeIndex: number | null;
  onChangeIndex: (index: number | null) => void;
}

const ImageLightbox = ({ items, activeIndex, onChangeIndex }: ImageLightboxProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isOpen = activeIndex !== null && activeIndex >= 0 && activeIndex < items.length;
  const current = isOpen ? items[activeIndex] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      onChangeIndex(null);
    };

    // Fallback light-dismiss for browsers without native dialog closedby support
    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!("closedBy" in HTMLDialogElement.prototype)) {
        pressedOutside = isOutside(e);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!("closedBy" in HTMLDialogElement.prototype) && pressedOutside && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, [onChangeIndex]);

  useEffect(() => {
    if (!isOpen || items.length <= 1) return;
    const handleArrows = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onChangeIndex((activeIndex! - 1 + items.length) % items.length);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onChangeIndex((activeIndex! + 1) % items.length);
      }
    };
    window.addEventListener("keydown", handleArrows);
    return () => window.removeEventListener("keydown", handleArrows);
  }, [isOpen, activeIndex, items.length, onChangeIndex]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as Record<string, string>)}
      aria-labelledby={titleId}
      className="lightbox-dialog"
      style={{
        margin: "auto",
        maxWidth: "min(92vw, 960px)",
        maxHeight: "90dvh",
        padding: 0,
        background: "hsl(252, 18%, 10%)",
        color: "hsl(40, 25%, 88%)",
        border: "2px solid hsl(38, 85%, 55%)",
        boxShadow: "0 18px 48px rgba(0, 0, 0, 0.75)",
      }}
    >
      {current && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 14px",
              borderBottom: "1px solid hsl(250, 15%, 22%)",
            }}
          >
            <h3
              id={titleId}
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "clamp(8px, 1.8vw, 10px)",
                color: "hsl(38, 85%, 55%)",
                lineHeight: 1.5,
              }}
            >
              {current.title}
              {items.length > 1 ? ` (${activeIndex! + 1}/${items.length})` : ""}
            </h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close image preview"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 10,
                color: "hsl(40, 20%, 82%)",
                background: "hsl(250, 15%, 18%)",
                border: "1px solid hsl(250, 15%, 30%)",
                minWidth: 36,
                minHeight: 36,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              padding: 12,
              background: "hsl(255, 22%, 6%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={current.src}
              alt={current.alt}
              style={{
                maxWidth: "100%",
                maxHeight: "68dvh",
                width: "auto",
                height: "auto",
                display: "block",
                objectFit: "contain",
              }}
            />
          </div>

          {(current.description || items.length > 1) && (
            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                borderTop: "1px solid hsl(250, 15%, 20%)",
              }}
            >
              <p style={{ fontSize: 13.5, color: "hsl(40, 20%, 78%)", margin: 0 }}>
                {current.description}
              </p>
              {items.length > 1 && (
                <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                  <button
                    type="button"
                    onClick={() =>
                      onChangeIndex((activeIndex! - 1 + items.length) % items.length)
                    }
                    style={{
                      padding: "6px 10px",
                      background: "hsl(250, 15%, 16%)",
                      border: "1px solid hsl(250, 15%, 28%)",
                      color: "hsl(40, 25%, 88%)",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeIndex((activeIndex! + 1) % items.length)}
                    style={{
                      padding: "6px 10px",
                      background: "hsl(250, 15%, 16%)",
                      border: "1px solid hsl(250, 15%, 28%)",
                      color: "hsl(40, 25%, 88%)",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
};

export default ImageLightbox;
