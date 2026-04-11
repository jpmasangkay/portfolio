import { ReactNode, useEffect } from "react";

interface ScrollModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  emoji: string;
  children: ReactNode;
}

const ScrollModal = ({ open, onClose, title, emoji, children }: ScrollModalProps) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="scroll-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "hsla(255, 20%, 4%, 0.7)",
        backdropFilter: "blur(4px)",
        animation: "modalFadeIn 0.3s ease-out",
      }}
    >
      <div
        className="scroll-modal-content"
        style={{
          width: "clamp(95%, 90vw, 700px)",
          maxWidth: 700,
          maxHeight: "80dvh",
          overflowY: "auto",
          background: "linear-gradient(180deg, hsl(35, 25%, 18%) 0%, hsl(30, 20%, 14%) 100%)",
          border: "3px solid hsl(30, 30%, 28%)",
          boxShadow: "5px 5px 0 rgba(0,0,0,0.5), 0 0 40px hsla(38, 85%, 55%, 0.15), inset 0 1px 0 hsla(40, 40%, 50%, 0.1)",
          position: "relative",
          animation: "modalSlideIn 0.35s ease-out",
        }}
      >
        {/* Parchment texture lines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, hsla(40, 30%, 60%, 1) 28px, hsla(40, 30%, 60%, 1) 29px)",
            pointerEvents: "none",
          }}
        />

        {/* Top decoration */}
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg, transparent, hsl(38, 85%, 55%), transparent)",
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "clamp(12px, 3vw, 20px) clamp(14px, 4vw, 24px) clamp(8px, 2vw, 12px)",
            borderBottom: "2px solid hsla(30, 25%, 25%, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "clamp(18px, 4vw, 24px)" }}>{emoji}</span>
            <h2
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "clamp(9px, 2vw, 12px)",
                color: "hsl(38, 85%, 55%)",
                textShadow: "0 0 10px hsla(38, 85%, 55%, 0.3)",
                lineHeight: 1.8,
              }}
            >
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "clamp(10px, 2vw, 12px)",
              color: "hsl(250, 10%, 50%)",
              background: "hsl(250, 15%, 18%)",
              border: "2px solid hsl(250, 15%, 25%)",
              padding: "8px 12px",
              minWidth: 44,
              minHeight: 44,
              cursor: "pointer",
              boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.color = "hsl(0, 65%, 55%)";
              (e.target as HTMLButtonElement).style.borderColor = "hsl(0, 65%, 55%)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.color = "hsl(250, 10%, 50%)";
              (e.target as HTMLButtonElement).style.borderColor = "hsl(250, 15%, 25%)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "clamp(12px, 3vw, 20px) clamp(14px, 4vw, 24px) clamp(16px, 3vw, 24px)", position: "relative" }}>
          {children}
        </div>

        {/* Bottom decoration */}
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg, transparent, hsl(38, 85%, 55%), transparent)",
          }}
        />
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .scroll-modal-content::-webkit-scrollbar {
          width: 6px;
        }
        .scroll-modal-content::-webkit-scrollbar-track {
          background: hsl(30, 20%, 12%);
        }
        .scroll-modal-content::-webkit-scrollbar-thumb {
          background: hsl(30, 25%, 28%);
        }
      `}</style>
    </div>
  );
};

export default ScrollModal;
