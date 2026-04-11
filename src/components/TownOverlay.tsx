import type { BuildingId } from "@/data/portfolio-data";

interface TownOverlayProps {
  nearBuilding: { id: BuildingId; name: string; emoji: string } | null;
  modalOpen: boolean;
  onMobileMove?: (dx: number, dz: number) => void;
  onMobileInteract?: () => void;
}

const TownOverlay = ({ nearBuilding, modalOpen, onMobileMove, onMobileInteract }: TownOverlayProps) => {
  if (modalOpen) return null;

  // Mobile d-pad handlers
  const handleDPad = (dx: number, dz: number) => {
    if (onMobileMove) onMobileMove(dx, dz);
  };

  const dpadBtnStyle = (active?: boolean): React.CSSProperties => ({
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: active ? "hsla(38, 85%, 55%, 0.3)" : "hsla(255, 20%, 10%, 0.7)",
    border: "2px solid hsla(38, 85%, 55%, 0.4)",
    color: "hsl(38, 85%, 55%)",
    fontFamily: "'Press Start 2P', cursive",
    fontSize: "14px",
    cursor: "pointer",
    pointerEvents: "auto" as const,
    touchAction: "none" as const,
    userSelect: "none" as const,
  });

  return (
    <div
      id="town-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "clamp(8px, 2vw, 12px)",
            color: "hsl(38, 85%, 55%)",
            textShadow: "0 0 10px hsla(38, 85%, 55%, 0.4), 2px 2px 0 rgba(0,0,0,0.8)",
            letterSpacing: "0.15em",
          }}
        >
          🗡️ SHEALTIEL'S REALM
        </p>
      </div>

      {/* Interaction prompt */}
      {nearBuilding && (
        <div
          style={{
            position: "absolute",
            bottom: "clamp(100px, 20vh, 160px)",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          <div
            style={{
              background: "hsla(255, 20%, 7%, 0.92)",
              border: "2px solid hsl(38, 85%, 55%)",
              padding: "12px 24px",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.5), 0 0 20px hsla(38, 85%, 55%, 0.2)",
            }}
          >
            <p
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "clamp(8px, 2vw, 11px)",
                color: "hsl(40, 25%, 85%)",
                marginBottom: 4,
              }}
            >
              {nearBuilding.emoji} {nearBuilding.name}
            </p>
            <p
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "clamp(6px, 1.5vw, 8px)",
                color: "hsl(38, 85%, 55%)",
                letterSpacing: "0.1em",
              }}
            >
              <span className="hide-mobile">PRESS [E] OR [SPACE] TO ENTER</span>
              <span className="show-mobile">TAP ⚔️ TO ENTER</span>
            </p>
          </div>
        </div>
      )}

      {/* Controls hint (desktop only) */}
      <div
        className="hide-mobile"
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
        }}
      >
        <div
          style={{
            background: "hsla(255, 20%, 7%, 0.75)",
            border: "1px solid hsla(250, 15%, 25%, 0.6)",
            padding: "8px 12px",
          }}
        >
          <p
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "7px",
              color: "hsl(250, 10%, 50%)",
              lineHeight: "2",
            }}
          >
            WASD / ARROWS — MOVE<br />
            E / SPACE — INTERACT<br />
            ESC — CLOSE
          </p>
        </div>
      </div>

      {/* Building Legend Guide (bigger) - hidden on mobile */}
      <div
        className="hide-mobile"
        style={{
          position: "absolute",
          bottom: "clamp(12px, 2vw, 16px)",
          right: "clamp(12px, 2vw, 16px)",
        }}
      >
        <div
          style={{
            background: "hsla(255, 20%, 7%, 0.88)",
            border: "2px solid hsla(250, 15%, 25%, 0.6)",
            padding: "clamp(10px, 2vw, 16px) clamp(12px, 2vw, 18px)",
            borderRadius: 2,
            boxShadow: "0 0 15px rgba(0,0,0,0.5)",
          }}
        >
          <p
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "clamp(7px, 1.5vw, 9px)",
              color: "hsl(38, 85%, 55%)",
              marginBottom: "clamp(8px, 1.5vw, 12px)",
              letterSpacing: "0.12em",
              textShadow: "0 0 8px hsla(38, 85%, 55%, 0.3)",
            }}
          >
            🗺️ BUILDING GUIDE
          </p>
          {[
            { emoji: "🏰", name: "Gate", desc: "Welcome", color: "#ffdd44" },
            { emoji: "🍺", name: "Tavern", desc: "About Me", color: "#ff8833" },
            { emoji: "📜", name: "Quest Board", desc: "Repos", color: "#44ddff" },
            { emoji: "🧙", name: "Tower", desc: "Skills", color: "#aa66ff" },
            { emoji: "🎨", name: "Gallery", desc: "Artwork", color: "#ff66aa" },
            { emoji: "⚒️", name: "Forge", desc: "3D Work", color: "#ff4422" },
            { emoji: "🏆", name: "Notice", desc: "Certs", color: "#44ff66" },
            { emoji: "🕊️", name: "Exit", desc: "Contact", color: "#ffffff" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(6px, 1vw, 10px)",
                marginBottom: "clamp(4px, 0.8vw, 6px)",
              }}
            >
              <div
                style={{
                  width: "clamp(6px, 1.2vw, 10px)",
                  height: "clamp(6px, 1.2vw, 10px)",
                  borderRadius: "50%",
                  background: item.color,
                  boxShadow: `0 0 6px ${item.color}`,
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: "clamp(6px, 1.2vw, 8px)",
                  color: "hsl(250, 10%, 65%)",
                  whiteSpace: "nowrap",
                }}
              >
                {item.emoji} {item.name}{" "}
                <span style={{ color: "hsl(250, 10%, 42%)" }}>— {item.desc}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Touch Controls */}
      <div
        className="show-mobile"
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          pointerEvents: "auto",
        }}
      >
        {/* D-Pad */}
        <div style={{ display: "grid", gridTemplateColumns: "48px 48px 48px", gridTemplateRows: "48px 48px 48px", gap: 2 }}>
          <div />
          <button
            style={dpadBtnStyle()}
            onTouchStart={(e) => { e.preventDefault(); handleDPad(0, -1); }}
            onTouchEnd={(e) => { e.preventDefault(); handleDPad(0, 0); }}
            onMouseDown={() => handleDPad(0, -1)}
            onMouseUp={() => handleDPad(0, 0)}
          >▲</button>
          <div />
          <button
            style={dpadBtnStyle()}
            onTouchStart={(e) => { e.preventDefault(); handleDPad(-1, 0); }}
            onTouchEnd={(e) => { e.preventDefault(); handleDPad(0, 0); }}
            onMouseDown={() => handleDPad(-1, 0)}
            onMouseUp={() => handleDPad(0, 0)}
          >◀</button>
          <div style={{ ...dpadBtnStyle(), background: "hsla(255, 20%, 10%, 0.3)", border: "1px solid hsla(250, 15%, 25%, 0.3)" }} />
          <button
            style={dpadBtnStyle()}
            onTouchStart={(e) => { e.preventDefault(); handleDPad(1, 0); }}
            onTouchEnd={(e) => { e.preventDefault(); handleDPad(0, 0); }}
            onMouseDown={() => handleDPad(1, 0)}
            onMouseUp={() => handleDPad(0, 0)}
          >▶</button>
          <div />
          <button
            style={dpadBtnStyle()}
            onTouchStart={(e) => { e.preventDefault(); handleDPad(0, 1); }}
            onTouchEnd={(e) => { e.preventDefault(); handleDPad(0, 0); }}
            onMouseDown={() => handleDPad(0, 1)}
            onMouseUp={() => handleDPad(0, 0)}
          >▼</button>
          <div />
        </div>
      </div>

      {/* Mobile Interact Button */}
      <div
        className="show-mobile"
        style={{
          position: "absolute",
          bottom: 30,
          right: "clamp(12px, 2vw, 16px)",
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={() => onMobileInteract?.()}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: nearBuilding
              ? "hsla(38, 85%, 55%, 0.3)"
              : "hsla(255, 20%, 10%, 0.6)",
            border: nearBuilding
              ? "3px solid hsl(38, 85%, 55%)"
              : "2px solid hsla(250, 15%, 25%, 0.5)",
            color: nearBuilding ? "hsl(38, 85%, 55%)" : "hsl(250, 10%, 45%)",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "18px",
            cursor: "pointer",
            touchAction: "none",
            boxShadow: nearBuilding
              ? "0 0 15px hsla(38, 85%, 55%, 0.4)"
              : "none",
            transition: "all 0.2s ease",
          }}
        >
          ⚔️
        </button>
      </div>

      {/* Responsive styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .show-mobile { display: none !important; }
        .hide-mobile { display: block; }
        @media (max-width: 768px), (pointer: coarse) {
          .show-mobile { display: flex !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TownOverlay;
