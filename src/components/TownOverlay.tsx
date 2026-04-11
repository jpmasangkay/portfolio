import { useState, useRef, useEffect } from "react";
import type { BuildingId } from "@/data/portfolio-data";
import { setMobileDir, triggerMobileInteract } from "@/lib/mobile-input";

interface TownOverlayProps {
  nearBuilding: { id: BuildingId; name: string; emoji: string } | null;
  modalOpen: boolean;
}

const BUILDING_GUIDE = [
  { emoji: "🏰", name: "Gate", desc: "Welcome", color: "#ffdd44" },
  { emoji: "🍺", name: "Tavern", desc: "About Me", color: "#ff8833" },
  { emoji: "📜", name: "Quest Board", desc: "Repos", color: "#44ddff" },
  { emoji: "🧙", name: "Tower", desc: "Skills", color: "#aa66ff" },
  { emoji: "🎨", name: "Gallery", desc: "Artwork", color: "#ff66aa" },
  { emoji: "⚒️", name: "Forge", desc: "3D Work", color: "#ff4422" },
  { emoji: "🏆", name: "Notice", desc: "Certs", color: "#44ff66" },
  { emoji: "🕊️", name: "Exit", desc: "Contact", color: "#ffffff" },
];

const TownOverlay = ({ nearBuilding, modalOpen }: TownOverlayProps) => {
  const [guideOpen, setGuideOpen] = useState(false);

  if (modalOpen) return null;

  const dpadBtnBase: React.CSSProperties = {
    width: 56,
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "hsla(255, 20%, 10%, 0.75)",
    border: "2px solid hsla(38, 85%, 55%, 0.4)",
    color: "hsl(38, 85%, 55%)",
    fontFamily: "'Press Start 2P', cursive",
    fontSize: "16px",
    cursor: "pointer",
    touchAction: "none",
    userSelect: "none",
    borderRadius: 4,
    outline: "none",
    padding: 0,
    WebkitUserSelect: "none",
    WebkitTapHighlightColor: "transparent",
  };

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
            textShadow:
              "0 0 10px hsla(38, 85%, 55%, 0.4), 2px 2px 0 rgba(0,0,0,0.8)",
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
              boxShadow:
                "3px 3px 0 rgba(0,0,0,0.5), 0 0 20px hsla(38, 85%, 55%, 0.2)",
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
              <span className="hide-mobile">
                PRESS [E] OR [SPACE] TO ENTER
              </span>
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
            WASD / ARROWS — MOVE
            <br />
            E / SPACE — INTERACT
            <br />
            ESC — CLOSE
          </p>
        </div>
      </div>

      {/* Building Legend Guide (desktop) */}
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
          {BUILDING_GUIDE.map((item, i) => (
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
                <span style={{ color: "hsl(250, 10%, 42%)" }}>
                  — {item.desc}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ========== MOBILE: Building Guide (collapsible) ========== */}
      <div
        className="show-mobile"
        style={{
          position: "absolute",
          top: 42,
          right: 8,
          pointerEvents: "auto",
          zIndex: 20,
        }}
      >
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: guideOpen
              ? "hsla(38, 85%, 55%, 0.2)"
              : "hsla(255, 20%, 10%, 0.8)",
            border: guideOpen
              ? "2px solid hsl(38, 85%, 55%)"
              : "2px solid hsla(250, 15%, 25%, 0.6)",
            padding: "6px 10px",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "7px",
            color: guideOpen ? "hsl(38, 85%, 55%)" : "hsl(250, 10%, 60%)",
            cursor: "pointer",
            borderRadius: 2,
            touchAction: "manipulation",
            transition: "all 0.2s ease",
            boxShadow: guideOpen
              ? "0 0 10px hsla(38, 85%, 55%, 0.3)"
              : "none",
          }}
        >
          🗺️ {guideOpen ? "✕" : "MAP"}
        </button>

        {guideOpen && (
          <div
            style={{
              marginTop: 4,
              background: "hsla(255, 20%, 7%, 0.94)",
              border: "2px solid hsla(250, 15%, 25%, 0.6)",
              padding: "10px 12px",
              borderRadius: 2,
              boxShadow: "0 0 15px rgba(0,0,0,0.6)",
              animation: "fadeInGuide 0.2s ease-out",
            }}
          >
            <p
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "6px",
                color: "hsl(38, 85%, 55%)",
                marginBottom: 8,
                letterSpacing: "0.1em",
                textShadow: "0 0 8px hsla(38, 85%, 55%, 0.3)",
              }}
            >
              BUILDING GUIDE
            </p>
            {BUILDING_GUIDE.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: item.color,
                    boxShadow: `0 0 4px ${item.color}`,
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: "5px",
                    color: "hsl(250, 10%, 65%)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.emoji} {item.name}{" "}
                  <span style={{ color: "hsl(250, 10%, 42%)" }}>
                    — {item.desc}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== MOBILE: D-Pad ========== */}
      <div
        className="show-mobile"
        id="mobile-dpad"
        style={{
          position: "absolute",
          bottom: 24,
          left: 16,
          pointerEvents: "auto",
          touchAction: "none",
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "56px 56px 56px",
            gridTemplateRows: "56px 56px 56px",
            gap: 3,
          }}
        >
          <div />
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              setMobileDir(0, -1);
              e.currentTarget.style.background = "hsla(38, 85%, 55%, 0.35)";
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              setMobileDir(0, 0);
              e.currentTarget.style.background = "hsla(255, 20%, 10%, 0.75)";
            }}
            onPointerOut={(e) => {
              setMobileDir(0, 0);
              e.currentTarget.style.background = "hsla(255, 20%, 10%, 0.75)";
            }}
            onContextMenu={(e) => e.preventDefault()}
            style={dpadBtnBase}
          >
            ▲
          </button>
          <div />
          
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              setMobileDir(-1, 0);
              e.currentTarget.style.background = "hsla(38, 85%, 55%, 0.35)";
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              setMobileDir(0, 0);
              e.currentTarget.style.background = "hsla(255, 20%, 10%, 0.75)";
            }}
            onPointerOut={(e) => {
              setMobileDir(0, 0);
              e.currentTarget.style.background = "hsla(255, 20%, 10%, 0.75)";
            }}
            onContextMenu={(e) => e.preventDefault()}
            style={dpadBtnBase}
          >
            ◀
          </button>
          <div
            style={{
              ...dpadBtnBase,
              background: "hsla(255, 20%, 10%, 0.3)",
              border: "1px solid hsla(250, 15%, 25%, 0.3)",
              cursor: "default",
            }}
          />
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              setMobileDir(1, 0);
              e.currentTarget.style.background = "hsla(38, 85%, 55%, 0.35)";
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              setMobileDir(0, 0);
              e.currentTarget.style.background = "hsla(255, 20%, 10%, 0.75)";
            }}
            onPointerOut={(e) => {
              setMobileDir(0, 0);
              e.currentTarget.style.background = "hsla(255, 20%, 10%, 0.75)";
            }}
            onContextMenu={(e) => e.preventDefault()}
            style={dpadBtnBase}
          >
            ▶
          </button>
          <div />
          
          <div />
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              setMobileDir(0, 1);
              e.currentTarget.style.background = "hsla(38, 85%, 55%, 0.35)";
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              setMobileDir(0, 0);
              e.currentTarget.style.background = "hsla(255, 20%, 10%, 0.75)";
            }}
            onPointerOut={(e) => {
              setMobileDir(0, 0);
              e.currentTarget.style.background = "hsla(255, 20%, 10%, 0.75)";
            }}
            onContextMenu={(e) => e.preventDefault()}
            style={dpadBtnBase}
          >
            ▼
          </button>
          <div />
        </div>
      </div>

      {/* Mobile Interact Button */}
      <div
        className="show-mobile"
        style={{
          position: "absolute",
          bottom: 40,
          right: 16,
          pointerEvents: "auto",
          touchAction: "none",
          zIndex: 20,
        }}
      >
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            triggerMobileInteract();
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            width: 68,
            height: 68,
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
            color: nearBuilding
              ? "hsl(38, 85%, 55%)"
              : "hsl(250, 10%, 45%)",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "20px",
            cursor: "pointer",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTapHighlightColor: "transparent",
            boxShadow: nearBuilding
              ? "0 0 15px hsla(38, 85%, 55%, 0.4)"
              : "none",
            transition: "all 0.2s ease",
            outline: "none",
            padding: 0,
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
        @keyframes fadeInGuide {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .show-mobile { display: none !important; }
        .hide-mobile { display: block; }
        @media (max-width: 768px), (pointer: coarse) {
          .show-mobile { display: flex !important; }
          .hide-mobile { display: none !important; }
        }
        #mobile-dpad button {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }
      `}</style>
    </div>
  );
};

export default TownOverlay;
