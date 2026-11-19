import { useState } from "react";
import type { BuildingId } from "@/data/portfolio-data";
import type { VillagerDef } from "@/data/villagers";
import { triggerMobileInteract } from "@/lib/mobile-input";
import type { InteriorId, SecretFindDef } from "@/lib/realm-progression";
import {
  TOWN_BUILDINGS_LAYOUT,
  findNearestUnvisitedBuilding,
} from "@/lib/town-buildings";
import { ZONE_METADATA, type ZoneId } from "@/lib/town-zones";
import MobileThumbstick from "@/components/MobileThumbstick";
import type { InteriorActionPrompt } from "@/components/TownWorld";

interface TownOverlayProps {
  nearBuilding: { id: BuildingId; name: string; emoji: string } | null;
  nearVillager?: VillagerDef | null;
  nearSecret?: SecretFindDef | null;
  nearInteriorAction?: InteriorActionPrompt | null;
  currentInterior?: InteriorId | null;
  greetedByRowan?: boolean;
  currentZone?: ZoneId;
  zoneTransitioning?: boolean;
  level?: number;
  xp?: number;
  progressPct?: number;
  secretsFoundCount?: number;
  totalSecretsCount?: number;
  timeInfo?: { label: string; emoji: string; raining: boolean };
  nightPinned?: boolean;
  lowGraphics?: boolean;
  discoveryToast?: string | null;
  modalOpen: boolean;
  visitedBuildings: ReadonlySet<BuildingId>;
  playerPos: { x: number; z: number };
  onSelectBuilding: (buildingId: BuildingId) => void;
  onToggleQuickView: () => void;
  onOpenQuestLog?: () => void;
  onToggleNightPin?: () => void;
  onToggleLowGraphics?: () => void;
  onExitInterior?: () => void;
}

function toMinimapCoords(x: number, z: number): { mx: number; my: number } {
  // Isometric projection so minimap UP matches pressing W / screen UP
  const isoX = (x - z) * Math.SQRT1_2;
  const isoY = (x + z) * Math.SQRT1_2;
  // Expanded realm spans roughly [-35..35], scale 1.25 fits outskirts & town inside 108x108
  const scale = 1.25;
  return {
    mx: 54 + isoX * scale,
    my: 54 + isoY * scale,
  };
}

const TownOverlay = ({
  nearBuilding,
  nearVillager = null,
  nearSecret = null,
  nearInteriorAction = null,
  currentInterior = null,
  greetedByRowan = true,
  currentZone = "town",
  zoneTransitioning = false,
  level = 1,
  xp = 0,
  progressPct = 0,
  secretsFoundCount = 0,
  totalSecretsCount = 5,
  timeInfo = { label: "Midnight", emoji: "🌙", raining: false },
  nightPinned = true,
  lowGraphics = false,
  discoveryToast = null,
  modalOpen,
  visitedBuildings,
  playerPos,
  onSelectBuilding,
  onToggleQuickView,
  onOpenQuestLog,
  onToggleNightPin,
  onToggleLowGraphics,
  onExitInterior,
}: TownOverlayProps) => {
  const [guideOpen, setGuideOpen] = useState(false);

  if (modalOpen) return null;

  const visitedCount = visitedBuildings.size;
  const totalCount = TOWN_BUILDINGS_LAYOUT.length;
  const zoneMeta = ZONE_METADATA[currentZone];
  const hasInteractTarget = Boolean(
    nearInteriorAction || nearSecret || nearVillager || nearBuilding
  );
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
      data-zone={currentZone}
      data-player-x={playerPos.x.toFixed(2)}
      data-player-z={playerPos.z.toFixed(2)}
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
      {/* Zone transition fog-fade vignette */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 8,
          background:
            "radial-gradient(circle at 50% 50%, hsla(255, 30%, 8%, 0.25) 0%, hsla(255, 35%, 6%, 0.88) 85%)",
          opacity: zoneTransitioning ? 1 : 0,
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Title + Subtitle + Zone indicator */}
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
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          <span
            id="zone-indicator"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10.5,
              color: currentInterior ? "hsl(38, 85%, 65%)" : "hsl(150, 50%, 66%)",
              background: "hsla(255, 22%, 8%, 0.72)",
              border: currentInterior
                ? "1px solid hsla(38, 85%, 55%, 0.55)"
                : "1px solid hsla(150, 35%, 36%, 0.55)",
              padding: "2px 8px",
              display: "inline-block",
              letterSpacing: "0.04em",
            }}
          >
            {currentInterior === "tavern"
              ? "🍺 Inside The Tavern — Walk up to the Dossier Desk"
              : currentInterior === "wizard"
              ? "🧙 Inside Wizard's Tower — Inspect the Arcane Tome"
              : `${zoneMeta.emoji} ${zoneMeta.name} — ${zoneMeta.subtitle}`}
          </span>

          {currentInterior && onExitInterior && (
            <button
              type="button"
              id="exit-interior-btn"
              onClick={onExitInterior}
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "7.5px",
                color: "hsl(255, 20%, 8%)",
                background: "hsl(38, 85%, 55%)",
                border: "1px solid hsl(38, 90%, 65%)",
                padding: "4px 8px",
                cursor: "pointer",
                pointerEvents: "auto",
              }}
            >
              🚪 Leave Room
            </button>
          )}
        </div>
      </div>

      {/* Discovery Toast Banner (Secrets / Level Up) */}
      {discoveryToast && (
        <div
          id="discovery-toast"
          role="status"
          style={{
            position: "fixed",
            top: 108,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 28,
            background: "hsla(255, 22%, 8%, 0.94)",
            border: "1px solid hsl(38, 85%, 55%)",
            padding: "6px 14px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11.5,
            color: "hsl(38, 85%, 68%)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
          }}
        >
          {discoveryToast}
        </div>
      )}

      {/* Level / XP / Secrets + Time & Night Pin Strip (top-left on desktop, bottom-center on mobile) */}
      <div className="status-hud" style={{ pointerEvents: "auto" }}>
        <div
          style={{
            background: "hsla(255, 22%, 8%, 0.88)",
            border: "1px solid hsla(250, 15%, 28%, 0.8)",
            padding: "6px 9px",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span id="hud-level" style={{ color: "hsl(38, 85%, 62%)", fontWeight: 700 }}>
              ⭐ LV {level}
            </span>
            <span className="hide-mobile" style={{ color: "hsl(250, 12%, 68%)" }}>
              {xp} XP
            </span>
            <span id="hud-secrets" style={{ color: "hsl(180, 65%, 66%)" }}>
              🔮 {secretsFoundCount}/{totalSecretsCount}
            </span>
          </div>
          <div
            aria-hidden="true"
            style={{
              width: "100%",
              height: 3,
              background: "hsl(252, 16%, 16%)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: "hsl(38, 85%, 55%)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          {onToggleNightPin && (
            <button
              type="button"
              id="night-pin-toggle"
              aria-pressed={nightPinned}
              onClick={onToggleNightPin}
              title={nightPinned ? "Time pinned to midnight (click to allow cycle)" : "Day/night cycling active (click to pin night)"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
                background: nightPinned
                  ? "hsla(250, 22%, 15%, 0.8)"
                  : "hsla(38, 60%, 20%, 0.45)",
                border: "1px solid hsla(250, 15%, 30%, 0.75)",
                padding: "3px 6px",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10.5,
                color: "hsl(40, 22%, 86%)",
                borderRadius: 2,
              }}
            >
              <span>
                {timeInfo.raining ? "🌧️" : timeInfo.emoji} {timeInfo.label}
              </span>
              <span style={{ color: nightPinned ? "hsl(150, 55%, 62%)" : "hsl(38, 85%, 62%)" }}>
                {nightPinned ? "📌 Night" : "↻ Cycle"}
              </span>
            </button>
          )}
          {onToggleLowGraphics && (
            <button
              type="button"
              id="low-graphics-toggle"
              aria-pressed={lowGraphics}
              onClick={onToggleLowGraphics}
              title={lowGraphics ? "Low graphics enabled (click for auto quality)" : "Auto graphics quality (click to force Low graphics)"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
                background: lowGraphics
                  ? "hsla(38, 60%, 20%, 0.55)"
                  : "hsla(250, 22%, 15%, 0.8)",
                border: "1px solid hsla(250, 15%, 30%, 0.75)",
                padding: "3px 6px",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10.5,
                color: "hsl(40, 22%, 86%)",
                borderRadius: 2,
              }}
            >
              <span>⚡ Low graphics</span>
              <span style={{ color: lowGraphics ? "hsl(38, 85%, 62%)" : "hsl(150, 55%, 62%)" }}>
                {lowGraphics ? "ON" : "AUTO"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Top-right Quest Log + Quick View Toggle + Mobile MAP + Nearest Unvisited Compass */}
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
          {onOpenQuestLog && (
            <button
              type="button"
              id="quest-log-toggle"
              onClick={onOpenQuestLog}
              aria-label={`Open Quest Log (${visitedCount} of ${totalCount} visited)`}
              className="top-hud-btn"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "7.5px",
                color:
                  visitedCount >= totalCount
                    ? "hsl(150, 60%, 65%)"
                    : "hsl(40, 25%, 90%)",
                background: "hsla(255, 20%, 8%, 0.9)",
                border:
                  visitedCount >= totalCount
                    ? "1px solid hsla(150, 55%, 45%, 0.75)"
                    : "1px solid hsla(250, 15%, 32%, 0.75)",
                padding: "8px 10px",
                cursor: "pointer",
                borderRadius: 2,
                whiteSpace: "nowrap",
                boxShadow: "0 0 10px rgba(0,0,0,0.45)",
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
            >
              <span className="hide-mobile">
                📒 Quests ({visitedCount}/{totalCount})
              </span>
              <span className="show-mobile-inline">
                📒 {visitedCount}/{totalCount}
              </span>
            </button>
          )}

          <button
            type="button"
            id="quick-view-toggle"
            onClick={onToggleQuickView}
            className="top-hud-btn"
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "7.5px",
              color: "hsl(40, 25%, 90%)",
              background: "hsla(255, 20%, 8%, 0.9)",
              border: "1px solid hsla(38, 85%, 55%, 0.55)",
              padding: "8px 10px",
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
            className="show-mobile top-hud-btn"
            aria-expanded={guideOpen}
            aria-controls="mobile-guide-panel"
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
              padding: "8px 9px",
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
            id="mobile-guide-panel"
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

      {/* Interaction prompt (matches TownWorld priority: interior -> secret -> villager -> building) */}
      {hasInteractTarget && (
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
              border: nearInteriorAction
                ? "2px solid hsl(275, 70%, 65%)"
                : nearSecret
                ? "2px solid hsl(185, 75%, 58%)"
                : nearVillager
                ? "2px solid hsl(150, 55%, 50%)"
                : "2px solid hsl(38, 85%, 55%)",
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
              {nearInteriorAction
                ? `${nearInteriorAction.emoji} ${nearInteriorAction.label}`
                : nearSecret
                ? `${nearSecret.emoji} Secret Find: ${nearSecret.name}`
                : nearVillager
                ? `${nearVillager.emoji} ${nearVillager.name} — ${nearVillager.role}`
                : `${nearBuilding?.emoji} ${nearBuilding?.name}`}
            </p>
            {!nearInteriorAction && !nearSecret && nearVillager?.isGreeter && !greetedByRowan && (
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "12px",
                  color: "hsl(40, 25%, 86%)",
                  marginBottom: 5,
                }}
              >
                Welcome! Walk with WASD / Thumbstick — talk with me for controls &amp; tips.
              </p>
            )}
            <p
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "clamp(6px, 1.5vw, 8px)",
                color: nearInteriorAction
                  ? "hsl(275, 75%, 72%)"
                  : nearSecret
                  ? "hsl(185, 75%, 64%)"
                  : nearVillager
                  ? "hsl(150, 60%, 60%)"
                  : "hsl(38, 85%, 55%)",
                letterSpacing: "0.1em",
              }}
            >
              <span className="hide-mobile">
                {nearInteriorAction
                  ? nearInteriorAction.actionType === "exit"
                    ? "PRESS [E] OR [SPACE] TO LEAVE ROOM"
                    : "PRESS [E] OR [SPACE] TO INSPECT"
                  : nearSecret
                  ? "PRESS [E] OR [SPACE] TO COLLECT (+75 XP)"
                  : nearVillager
                  ? "PRESS [E] OR [SPACE] TO TALK"
                  : nearBuilding && (nearBuilding.id === "tavern" || nearBuilding.id === "wizard")
                  ? "PRESS [E] OR [SPACE] TO STEP INSIDE"
                  : "PRESS [E] OR [SPACE] TO ENTER"}
              </span>
              <span className="show-mobile">
                {nearInteriorAction
                  ? nearInteriorAction.actionType === "exit"
                    ? "TAP ⚔️ TO LEAVE"
                    : "TAP ⚔️ TO INSPECT"
                  : nearSecret
                  ? "TAP ⚔️ TO COLLECT"
                  : nearVillager
                  ? "TAP ⚔️ TO TALK"
                  : nearBuilding && (nearBuilding.id === "tavern" || nearBuilding.id === "wizard")
                  ? "TAP ⚔️ TO STEP INSIDE"
                  : "TAP ⚔️ TO ENTER"}
              </span>
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
            {/* Isometric town wall diamond, outskirt biomes & road network */}
            {(() => {
              const nw = toMinimapCoords(-18, -16);
              const ne = toMinimapCoords(18, -16);
              const se = toMinimapCoords(18, 18);
              const sw = toMinimapCoords(-18, 18);
              const nEnd = toMinimapCoords(0, -29);
              const sEnd = toMinimapCoords(0, 19);
              const wEnd = toMinimapCoords(-28, 0);
              const eEnd = toMinimapCoords(29, 0);
              const forestGlade = toMinimapCoords(-28, 9);
              const lakeside = toMinimapCoords(32, 0);
              const ruins = toMinimapCoords(0, -29);
              return (
                <>
                  {/* Town courtyard & fortified perimeter diamond */}
                  <polygon
                    points={`${nw.mx},${nw.my} ${ne.mx},${ne.my} ${se.mx},${se.my} ${sw.mx},${sw.my}`}
                    fill="#1b2b22"
                    stroke="#53506a"
                    strokeWidth={1.25}
                  />
                  {/* Outskirt zone markers */}
                  <circle cx={forestGlade.mx} cy={forestGlade.my} r={5.5} fill="#1f4933" stroke="#356e4e" strokeWidth={0.8} opacity={0.9}>
                    <title>Whispering Forest Glade (West)</title>
                  </circle>
                  <circle cx={lakeside.mx} cy={lakeside.my} r={6} fill="#1d4d7a" stroke="#397cb8" strokeWidth={0.8} opacity={0.9}>
                    <title>Moonlit Lakeside (East)</title>
                  </circle>
                  <circle cx={ruins.mx} cy={ruins.my} r={5} fill="#463a4f" stroke="#7d698c" strokeWidth={0.8} opacity={0.9}>
                    <title>Ruined Hilltop (North)</title>
                  </circle>
                  {/* Main crossroad lines */}
                  <line
                    x1={nEnd.mx}
                    y1={nEnd.my}
                    x2={sEnd.mx}
                    y2={sEnd.my}
                    stroke="#61564a"
                    strokeWidth={2}
                    strokeDasharray="2 1.5"
                    opacity={0.75}
                  />
                  <line
                    x1={wEnd.mx}
                    y1={wEnd.my}
                    x2={eEnd.mx}
                    y2={eEnd.my}
                    stroke="#61564a"
                    strokeWidth={2}
                    strokeDasharray="2 1.5"
                    opacity={0.75}
                  />
                </>
              );
            })()}
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
                      r={5.2}
                      fill="none"
                      stroke={b.beaconColorCss}
                      strokeWidth={0.9}
                      opacity={0.75}
                    />
                  )}
                  <circle
                    cx={mx}
                    cy={my}
                    r={3.2}
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
              r={3.3}
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
          aria-label={
            nearInteriorAction
              ? nearInteriorAction.label
              : nearSecret
              ? `Collect ${nearSecret.name}`
              : nearVillager
              ? "Talk to nearby villager"
              : "Interact with nearby building"
          }
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
            background: hasInteractTarget
              ? "hsla(38, 85%, 55%, 0.3)"
              : "hsla(255, 20%, 10%, 0.6)",
            border: hasInteractTarget
              ? nearSecret
                ? "3px solid hsl(185, 75%, 58%)"
                : nearVillager
                ? "3px solid hsl(150, 55%, 50%)"
                : "3px solid hsl(38, 85%, 55%)"
              : "2px solid hsla(250, 15%, 25%, 0.5)",
            color: hasInteractTarget
              ? nearSecret
                ? "hsl(185, 75%, 64%)"
                : nearVillager
                ? "hsl(150, 60%, 60%)"
                : "hsl(38, 85%, 55%)"
              : "hsl(250, 10%, 45%)",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: "20px",
            cursor: "pointer",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTapHighlightColor: "transparent",
            boxShadow: hasInteractTarget
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
        .status-hud {
          position: fixed;
          top: 56px;
          left: 16px;
          z-index: 20;
          min-width: 170px;
        }
        .guide-item-btn:hover,
        .top-hud-btn:hover,
        #unvisited-compass:hover,
        #night-pin-toggle:hover,
        #low-graphics-toggle:hover {
          border-color: hsl(38, 85%, 55%) !important;
        }
        .guide-item-btn:hover {
          transform: translateX(-2px);
        }
        .guide-item-btn:active,
        .top-hud-btn:active,
        #unvisited-compass:active,
        #night-pin-toggle:active,
        #low-graphics-toggle:active,
        #exit-interior-btn:active {
          transform: scale(0.97);
        }
        .guide-item-btn:focus-visible,
        .top-hud-btn:focus-visible,
        #quest-log-toggle:focus-visible,
        #quick-view-toggle:focus-visible,
        #unvisited-compass:focus-visible,
        #night-pin-toggle:focus-visible,
        #low-graphics-toggle:focus-visible,
        #exit-interior-btn:focus-visible {
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
          .top-hud-btn {
            font-size: 7px !important;
            padding: 7px 7px !important;
          }
          .compass-anchor {
            position: fixed;
            top: 112px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 19;
            white-space: nowrap;
          }
          .status-hud {
            top: auto;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            min-width: 140px;
            max-width: 156px;
          }
        }
      `}</style>
    </div>
  );
};

export default TownOverlay;
