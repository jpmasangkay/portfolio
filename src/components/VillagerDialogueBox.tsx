import { useEffect } from "react";
import type { VillagerDef } from "@/data/villagers";

interface VillagerDialogueBoxProps {
  villager: VillagerDef;
  lineIndex: number;
  onNext: () => void;
  onClose: () => void;
}

const VillagerDialogueBox = ({
  villager,
  lineIndex,
  onNext,
  onClose,
}: VillagerDialogueBoxProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key.toLowerCase() === "e" || e.key === " " || e.key === "Enter") {
        if (!e.repeat) {
          e.preventDefault();
          onNext();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onClose]);

  const currentLine = villager.lines[lineIndex % villager.lines.length];

  return (
    <div
      id="villager-dialogue-box"
      role="dialog"
      aria-label={`Conversation with ${villager.name}`}
      style={{
        position: "fixed",
        left: "50%",
        bottom: "clamp(150px, 22vh, 185px)",
        transform: "translateX(-50%)",
        width: "min(92vw, 540px)",
        zIndex: 35,
        background: "hsla(255, 22%, 8%, 0.96)",
        border: "2px solid hsl(38, 85%, 55%)",
        boxShadow: "0 10px 32px rgba(0,0,0,0.72)",
        padding: "14px 16px",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <p
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "9px",
            color: "hsl(38, 85%, 58%)",
            lineHeight: 1.5,
          }}
        >
          {villager.emoji} {villager.name}{" "}
          <span style={{ color: "hsl(150, 45%, 55%)", fontSize: "8px" }}>
            — {villager.role}
          </span>
        </p>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "hsl(250, 10%, 60%)",
          }}
        >
          {(lineIndex % villager.lines.length) + 1}/{villager.lines.length}
        </span>
      </div>

      <p
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14.5,
          lineHeight: 1.55,
          color: "hsl(40, 25%, 90%)",
          marginBottom: 12,
        }}
      >
        &ldquo;{currentLine}&rdquo;
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "8px",
            color: "hsl(255, 20%, 8%)",
            background: "hsl(38, 85%, 55%)",
            border: "1px solid hsl(38, 90%, 65%)",
            padding: "8px 12px",
            minHeight: 36,
            cursor: "pointer",
          }}
        >
          {lineIndex + 1 < villager.lines.length ? "Next →" : "Done ✓"}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "8px",
            color: "hsl(40, 20%, 80%)",
            background: "hsl(252, 16%, 16%)",
            border: "1px solid hsl(250, 15%, 28%)",
            padding: "8px 12px",
            minHeight: 36,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default VillagerDialogueBox;
