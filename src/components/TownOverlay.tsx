import { useState } from "react";
import type { BuildingId } from "@/data/portfolio-data";
import { triggerMobileInteract } from "@/lib/mobile-input";
import {
  TOWN_BUILDINGS_LAYOUT,
  findNearestUnvisitedBuilding,
} from "@/lib/town-buildings";
import MobileThumbstick from "@/components/MobileThumbstick";

interface TownOverlayProps {
  nearBuilding: { id: BuildingId; name: string; emoji: string } | null;
  modalOpen: boolean;
  visitedBuildings: ReadonlySet<BuildingId>;
  playerPos: { x: number; z: number };
  onSelectBuilding: (buildingId: BuildingId) => void;
  onToggleQuickView: () => void;
}

function toMinimapCoords(x: number, z: number): { mx: number; my: number } {
  // Isometric projection so minimap UP matches pressing W / screen UP
  const isoX = (x - z) * Math.SQRT1_2;
  const isoY = (x + z) * Math.SQRT1_2;
  // Town spans roughly [-20..20] -> iso range approx [-24..24]
  const scale = 1.9;
  return {
    mx: 54 + isoX * scale,
    my: 54 + isoY * scale,
  };
}

const TownOverlay = ({
  nearBuilding,
  modalOpen,
  visitedBuildings,
  playerPos,
  onSelectBuilding,
  onToggleQuickView,
}: TownOverlayProps) => {
  const [guideOpen, setGuideOpen] = useState(false);

  if (modalOpen) return null;

  const visitedCount = visitedBuildings.size;
  const totalCount = TOWN_BUILDINGS_LAYOUT.length;
  const nearestUnvisited = findNearestUnvisitedBuilding(
    playerPos.x,
    playerPos.z,
    visitedBuildings
  );
  const playerMapPos = toMinimapCoords(playerPos.x, playerPos.z);

  const renderGuideList = (compact: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 3 : 4 }}>
      {TOWN_BUILDINGS_LAYOUT.map((item) => {
        const visited = visitedBuildings.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            className="guide-item-btn"
            onClick={() => {
              onSelectBuilding(item.id);
              if (compact) setGuideOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: compact ? 6 : 10,
              background: visited
                ? "hsla(150, 35%, 16%, 0.35)"
                : "hsla(252, 18%, 14%, 0.7)",
              border: "1px solid hsla(250, 15%, 26%, 0.7)",
              padding: compact ? "5px 7px" : "5px 8px",
              cursor: "pointer",
              textAlign: "left",
              borderRadius: 2,
              width: "100%",
              transition: "border-color 0.15s ease, transform 0.1s ease, background 0.15s ease",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: compact ? 5 : 8 }}>
              <span
                aria-hidden="true"
                style={{
                  width: compact ? 6 : 8,
                  height: compact ? 6 : 8,
                  borderRadius: "50%",
                  background: item.beaconColorCss,
                  boxShadow: visited ? "none" : `0 0 6px ${item.beaconColorCss}`,
                  opacity: visited ? 0.65 : 1,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: compact ? "6px" : "7.5px",
                  color: visited ? "hsl(250, 10%, 72%)" : "hsl(40, 25%, 88%)",
                  whiteSpace: "nowrap",
                }}
              >
                {item.emoji} {item.shortName}{" "}
                <span style={{ color: "hsl(250, 10%, 52%)" }}>— {item.guideDesc}</span>
              </span>
            </span>
            <span
              aria-label={visited ? "Visited" : "Unvisited"}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: compact ? 9 : 11,
                fontWeight: 700,
                color: visited ? "hsl(150, 60%, 55%)" : "hsl(38, 85%, 55%)",
                marginLeft: 6,
                flexShrink: 0,
              }}
            >
              {visited ? "✓" : "→"}
            </span>
          </button>
        );
      })}
    </div>
  );

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
      {/* Title + Subtitle */}
      <div className="realm-header">
        <p
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "clamp(9px, 2vw, 12px)",
            color: "hsl(38, 85%, 55%)",
            textShadow:
              "0 0 10px hsla(38, 85%, 55%, 0.4), 2px 2px 0 rgba(0,0,0,0.85)",
            letterSpacing: "0.14em",
            marginBottom: 4,
          }}
        >
          🗡️ SHEALTIEL&apos;S REALM
        </p>
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(10px, 1.4vw, 12px)",
            color: "hsl(40, 20%, 82%)",
            background: "hsla(255, 20%, 7%, 0.68)",
            border: "1px solid hsla(250, 15%, 28%, 0.6)",
            padding: "2px 10px",
            display: "inline-block",
          }}
        >
          Shealtiel Masangkay · CS &amp; Web Developer ({visitedCount}/{totalCount} visited)
        </p>
      </div>

      {/* Top-right Quick View Toggle + Nearest Unvisited Compass (Desktop & Mobile) */}
      <div
        className="top-right-hud"
        style={{
          position: "absolute",
          pointerEvents: "auto",
          zIndex: 22,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            id="quick-view-toggle"
            onClick={onToggleQuickView}
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "7.5px",
              color: "hsl(40, 25%, 90%)",
              background: "hsla(255, 20%, 8%, 0.9)",
              border: "1px solid hsla(38, 85%, 55%, 0.55)",
              padding: "8px 11px",
              cursor: "pointer",
              borderRadius: 2,
              whiteSpace: "nowrap",
              boxShadow: "0 0 10px rgba(0,0,0,0.45)",
              transition: "border-color 0.15s ease, background 0.15s ease",
            }}
          >
            📄 Quick View
          </button>

          <button
            type="button"
            className="show-mobile"
            onClick={() => setGuideOpen(!guideOpen)}
            style={{
              alignItems: "center",
              gap: 4,
              background: guideOpen
                ? "hsla(38, 85%, 55%, 0.2)"
                : "hsla(255, 20%, 10%, 0.85)",
              border: guideOpen
                ? "1px solid hsl(38, 85%, 55%)"
                : "1px solid hsla(250, 15%, 30%, 0.7)",
              padding: "8px 10px",
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "7.5px",
              color: guideOpen ? "hsl(38, 85%, 55%)" : "hsl(40, 20%, 82%)",
              cursor: "pointer",
              borderRadius: 2,
              touchAction: "manipulation",
              whiteSpace: "nowrap",
            }}
          >
            🗺️ {guideOpen ? "✕" : "MAP"}
          </button>
        </div>

        {/* Nearest unvisited directional arrow (desktop sits under Quick View; mobile sits cleanly below subtitle) */}
        <div className="compass-anchor">
          {nearestUnvisited ? (
            <button
              type="button"
              id="unvisited-compass"
              onClick={() => onSelectBuilding(nearestUnvisited.building.id)}
              title={`Jump to ${nearestUnvisited.building.name}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "hsla(255, 20%, 8%, 0.88)",
                border: "1px solid hsla(250, 15%, 28%, 0.8)",
                padding: "5px 9px",
                cursor: "pointer",
                borderRadius: 2,
                color: "hsl(40, 25%, 88%)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `1px solid ${nearestUnvisited.building.beaconColorCss}`,
                  color: nearestUnvisited.building.beaconColorCss,
                  fontSize: 11,
                  fontWeight: 700,
                  transform: `rotate(${Math.round(nearestUnvisited.angleDeg)}deg)`,
                  transition: "transform 0.12s linear",
                }}
              >
                ↑
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                Next: {nearestUnvisited.building.emoji} {nearestUnvisited.building.shortName} (
                {Math.round(nearestUnvisited.distance)}m)
              </span>
            </button>
          ) : (
            <div
              style={{
                background: "hsla(150, 35%, 14%, 0.88)",
                border: "1px solid hsla(150, 50%, 45%, 0.6)",
                padding: "5px 9px",
                borderRadius: 2,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "hsl(150, 60%, 65%)",
              }}
            >
              ✓ All 8 landmarks explored
            </div>
          )}
        </div>

        {/* Mobile collapsible Building Guide + Minimap */}
        {guideOpen && (
          <div
            className="show-mobile"
            style={{
              position: "relative",
              zIndex: 30,
              flexDirection: "column",
              gap: 8,
              background: "hsla(255, 20%, 7%, 0.96)",
              border: "1px solid hsla(250, 15%, 28%, 0.85)",
              padding: "10px",
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0,0,0,0.65)",
              minWidth: 230,
            }}
          >
            <p
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "7px",
                color: "hsl(38, 85%, 55%)",
                letterSpacing: "0.08em",
              }}
            >
              CLICK A LANDMARK ({visitedCount}/{totalCount})
            </p>
            {renderGuideList(true)}
          </div>
        )}
      </div>

      {/* Interaction prompt */}
      {nearBuilding && (
        <div
          id="interaction-prompt"
          style={{
            position: "absolute",
            bottom: "clamp(220px, 30vh, 280px)",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            animation: "fadeInUp 0.3s ease-out",
            zIndex: 15,
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
            background: "hsla(255, 20%, 7%, 0.8)",
            border: "1px solid hsla(250, 15%, 28%, 0.7)",
            padding: "8px 12px",
          }}
        >
          <p
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "7px",
              color: "hsl(250, 10%, 60%)",
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

      {/* Desktop Minimap + Clickable Building Guide */}
      <div
        className="hide-mobile"
        style={{
          position: "absolute",
          bottom: "clamp(12px, 2vw, 16px)",
          right: "clamp(12px, 2vw, 16px)",
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {/* Isometric Minimap */}
        <div
          aria-label="Town Minimap"
          style={{
            background: "hsla(255, 20%, 7%, 0.9)",
            border: "1px solid hsla(250, 15%, 28%, 0.8)",
            padding: 8,
            borderRadius: 2,
            boxShadow: "0 0 15px rgba(0,0,0,0.5)",
          }}
        >
          <svg width={108} height={108} viewBox="0 0 108 108" role="img" aria-label="Town minimap showing visited and unvisited buildings">
            <rect x={0} y={0} width={108} height={108} fill="#121428" stroke="#2d3048" strokeWidth={1} />
            {/* Isometric road hints */}
            <line x1={54} y1={14} x2={54} y2={94} stroke="#3c3740" strokeWidth={3} strokeDasharray="2 2" opacity={0.45} />
            <line x1={14} y1={54} x2={94} y2={54} stroke="#3c3740" strokeWidth={3} strokeDasharray="2 2" opacity={0.45} />
            {/* Building pins */}
            {TOWN_BUILDINGS_LAYOUT.map((b) => {
              const { mx, my } = toMinimapCoords(b.x, b.z);
              const visited = visitedBuildings.has(b.id);
              return (
                <g
                  key={b.id}
                  onClick={() => onSelectBuilding(b.id)}
                  style={{ cursor: "pointer" }}
                >
                  <title>{`${b.name} (${visited ? "Visited" : "Unvisited"})`}</title>
                  {!visited && (
                    <circle
                      cx={mx}
                      cy={my}
                      r={6.5}
                      fill="none"
                      stroke={b.beaconColorCss}
                      strokeWidth={1}
                      opacity={0.75}
                    />
                  )}
                  <circle
                    cx={mx}
                    cy={my}
                    r={3.8}
                    fill={visited ? "#3b8a64" : b.beaconColorCss}
                    stroke="#0d0e1a"
                    strokeWidth={1}
                  />
                </g>
              );
            })}
            {/* Player dot */}
            <circle
              cx={playerMapPos.mx}
              cy={playerMapPos.my}
              r={3.5}
              fill="#f0c248"
              stroke="#ffffff"
              strokeWidth={1.2}
            />
          </svg>
        </div>

        {/* Building Legend Guide (clickable + visited ticks) */}
        <div
          style={{
            background: "hsla(255, 20%, 7%, 0.9)",
            border: "1px solid hsla(250, 15%, 28%, 0.8)",
            padding: "10px 12px",
            borderRadius: 2,
            boxShadow: "0 0 15px rgba(0,0,0,0.5)",
            minWidth: 235,
          }}
        >
          <p
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "8px",
              color: "hsl(38, 85%, 55%)",
              marginBottom: 8,
              letterSpacing: "0.1em",
            }}
          >
            🗺️ BUILDING GUIDE ({visitedCount}/{totalCount})
          </p>
          {renderGuideList(false)}
        </div>
      </div>

      {/* ========== MOBILE: Virtual Drag Thumbstick ========== */}
      <div
        className="show-mobile"
        style={{
          position: "absolute",
          bottom: 24,
          left: 20,
          pointerEvents: "auto",
          touchAction: "none",
          zIndex: 20,
        }}
      >
        <MobileThumbstick />
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
          type="button"
          aria-label="Interact with nearby building"
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
        .realm-header {
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          width: max-content;
          max-width: calc(100vw - 32px);
        }
        .top-right-hud {
          top: 16px;
          right: 16px;
        }
        .guide-item-btn:hover {
          border-color: hsl(38, 85%, 55%) !important;
          transform: translateX(-2px);
        }
        .guide-item-btn:focus-visible,
        #quick-view-toggle:focus-visible,
        #unvisited-compass:focus-visible {
          outline: 2px solid hsl(38, 85%, 55%);
          outline-offset: 2px;
        }
        .show-mobile { display: none !important; }
        .hide-mobile { display: flex; }
        @media (max-width: 768px), (pointer: coarse) {
          .show-mobile { display: flex !important; }
          .hide-mobile { display: none !important; }
          .realm-header {
            top: 46px;
          }
          .top-right-hud {
            top: 8px;
            right: 8px;
          }
          .compass-anchor {
            position: fixed;
            top: 90px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 19;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
};

export default TownOverlay;
