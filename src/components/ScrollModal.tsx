import { useEffect, useId, useRef, type ReactNode } from "react";

interface ScrollModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  emoji: string;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ScrollModal = ({ open, onClose, title, emoji, children }: ScrollModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    if (dialog) {
      if (typeof dialog.showModal === "function" && !dialog.open) {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? dialog).focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Yield if a nested ImageLightbox dialog is open above this modal
        if (document.querySelector("dialog[data-lightbox='true'][open]")) return;
        e.preventDefault();
        onClose();
        return;
      }

      // Defensive Tab focus trap for environments without native top-layer inerting
      if (e.key === "Tab" && dialog) {
        if (document.querySelector("dialog[data-lightbox='true'][open]")) return;
        const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (dialog?.open && typeof dialog.close === "function") {
        dialog.returnValue = "";
        dialog.close();
      }
      if (prevFocus && typeof prevFocus.focus === "function" && prevFocus.isConnected) {
        prevFocus.focus();
      }
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = "";
    };
    dialog.addEventListener("close", handleNativeClose);

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
      if (
        !("closedBy" in HTMLDialogElement.prototype) &&
        pressedOutside &&
        isOutside(e) &&
        !document.querySelector("dialog[data-lightbox='true'][open]")
      ) {
        onClose();
      }
      pressedOutside = false;
    };

    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("pointerup", onPointerUp);
    return () => {
      dialog.removeEventListener("close", handleNativeClose);
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("pointerup", onPointerUp);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="scroll-modal-overlay"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      {...({ closedby: "any" } as Record<string, string>)}
      onCancel={(e) => {
        e.preventDefault();
        if (!document.querySelector("dialog[data-lightbox='true'][open]")) {
          onClose();
        }
      }}
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          !document.querySelector("dialog[data-lightbox='true'][open]")
        ) {
          const r = e.currentTarget.getBoundingClientRect();
          const hasLayoutBox = r.width > 0 && r.height > 0;
          const clickedInsideBox =
            hasLayoutBox &&
            e.clientX >= r.left &&
            e.clientX <= r.right &&
            e.clientY >= r.top &&
            e.clientY <= r.bottom;
          if (!clickedInsideBox) {
            onClose();
          }
        }
      }}
      style={{
        margin: "auto",
        padding: 0,
        width: "min(92vw, 680px)",
        maxHeight: "min(86dvh, 720px)",
        background: "linear-gradient(175deg, hsl(252, 22%, 12%) 0%, hsl(255, 22%, 8%) 100%)",
        border: "1px solid hsla(38, 85%, 55%, 0.65)",
        boxShadow:
          "0 0 0 1px hsla(250, 20%, 22%, 0.9), 0 22px 60px rgba(0,0,0,0.8)",
        color: "hsl(40, 25%, 88%)",
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        overscrollBehavior: "contain",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 18px",
          borderBottom: "1px solid hsla(38, 85%, 55%, 0.35)",
          background: "hsla(255, 24%, 7%, 0.9)",
          flexShrink: 0,
        }}
      >
        <h2
          id={titleId}
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "clamp(10px, 2.2vw, 13px)",
            color: "hsl(38, 85%, 58%)",
            lineHeight: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span aria-hidden="true">{emoji}</span>
          <span>{title}</span>
        </h2>

        <button
          type="button"
          aria-label={`Close ${title}`}
          onClick={onClose}
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "10px",
            color: "hsl(40, 25%, 82%)",
            background: "hsl(252, 18%, 16%)",
            border: "1px solid hsl(250, 15%, 30%)",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "border-color 0.15s ease, color 0.15s ease",
          }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable Inner Content */}
      <div
        className="scroll-modal-content"
        style={{
          padding: "18px 20px",
          overflowY: "auto",
          flex: 1,
          overscrollBehavior: "contain",
        }}
      >
        {children}
      </div>
    </dialog>
  );
};

export default ScrollModal;
