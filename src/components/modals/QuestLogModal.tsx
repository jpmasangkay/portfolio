import { useState } from "react";
import { personalInfo, type BuildingId } from "@/data/portfolio-data";
import { TOWN_BUILDINGS_LAYOUT } from "@/lib/town-buildings";
import { ZONE_METADATA, type ZoneId } from "@/lib/town-zones";

interface QuestLogModalProps {
  visitedBuildings: ReadonlySet<BuildingId>;
  visitedZones: ReadonlySet<ZoneId>;
  greetedByRowan: boolean;
  cloakEquipped: boolean;
  onToggleCloak: () => void;
  onJumpToBuilding: (id: BuildingId) => void;
  onOpenQuickView: () => void;
}

const modalText: React.CSSProperties = {
  fontFamily: "'Space Grotesk', sans-serif",
  color: "hsl(40, 25%, 84%)",
  fontSize: 14,
  lineHeight: 1.6,
};

const QuestLogModal = ({
  visitedBuildings,
  visitedZones,
  greetedByRowan,
  cloakEquipped,
  onToggleCloak,
  onJumpToBuilding,
  onOpenQuickView,
}: QuestLogModalProps) => {
  const [copied, setCopied] = useState(false);
  const visitedCount = visitedBuildings.size;
  const totalLandmarks = TOWN_BUILDINGS_LAYOUT.length;
  const mainQuestComplete = visitedCount >= totalLandmarks;

  const outskirtZones: ZoneId[] = ["forest", "lakeside", "ruins"];
  const outskirtCount = outskirtZones.filter((z) => visitedZones.has(z)).length;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(personalInfo.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Main Quest: Visit all 8 places */}
      <div
        style={{
          background: "hsla(250, 15%, 14%, 0.7)",
          border: mainQuestComplete
            ? "1px solid hsl(150, 55%, 45%)"
            : "1px solid hsl(250, 15%, 26%)",
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <p
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 9,
              color: mainQuestComplete ? "hsl(150, 60%, 58%)" : "hsl(38, 85%, 55%)",
              lineHeight: 1.5,
            }}
          >
            {mainQuestComplete ? "✓" : "📜"} Main Quest: Explore All 8 Places
          </p>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: mainQuestComplete ? "hsl(150, 60%, 58%)" : "hsl(38, 85%, 60%)",
            }}
          >
            {visitedCount}/{totalLandmarks}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
            gap: 6,
          }}
        >
          {TOWN_BUILDINGS_LAYOUT.map((b) => {
            const done = visitedBuildings.has(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onJumpToBuilding(b.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 10px",
                  background: done
                    ? "hsla(150, 35%, 16%, 0.45)"
                    : "hsla(252, 18%, 12%, 0.75)",
                  border: "1px solid hsl(250, 15%, 24%)",
                  color: "hsl(40, 25%, 88%)",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>
                  {b.emoji} {b.shortName}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: done ? "hsl(150, 60%, 58%)" : "hsl(250, 10%, 50%)",
                  }}
                >
                  {done ? "✓" : "○"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Outskirts & Greeter Checklist */}
      <div
        style={{
          background: "hsla(250, 15%, 14%, 0.6)",
          border: "1px solid hsl(250, 15%, 24%)",
          padding: "12px 16px",
          display: "grid",
          gap: 8,
        }}
      >
        <p
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 8.5,
            color: "hsl(150, 45%, 55%)",
            marginBottom: 4,
          }}
        >
          🧭 Realm Expeditions
        </p>
        <div style={{ ...modalText, fontSize: 13.5, display: "flex", justifyContent: "space-between" }}>
          <span>🧭 Speak with Rowan the Greeter</span>
          <span style={{ color: greetedByRowan ? "hsl(150, 60%, 58%)" : "hsl(250, 10%, 55%)" }}>
            {greetedByRowan ? "✓ Done" : "Pending"}
          </span>
        </div>
        <div style={{ ...modalText, fontSize: 13.5, display: "flex", justifyContent: "space-between" }}>
          <span>🗺️ Discover the 3 Outskirt Zones</span>
          <span style={{ color: outskirtCount === 3 ? "hsl(150, 60%, 58%)" : "hsl(38, 85%, 60%)" }}>
            {outskirtCount}/3
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          {outskirtZones.map((zid) => {
            const z = ZONE_METADATA[zid];
            const found = visitedZones.has(zid);
            return (
              <span
                key={zid}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  padding: "4px 8px",
                  border: "1px solid hsl(250, 15%, 26%)",
                  background: found ? "hsla(150, 35%, 16%, 0.45)" : "hsla(252, 18%, 11%, 0.7)",
                  color: found ? "hsl(150, 60%, 65%)" : "hsl(250, 10%, 58%)",
                }}
              >
                {z.emoji} {z.name} {found ? "✓" : ""}
              </span>
            );
          })}
        </div>
      </div>

      {/* Completion Reward: Royal Cloak + "Hire Me" Scroll */}
      <div
        style={{
          background: mainQuestComplete
            ? "hsla(38, 45%, 15%, 0.45)"
            : "hsla(250, 15%, 12%, 0.5)",
          border: mainQuestComplete
            ? "1px solid hsl(38, 85%, 55%)"
            : "1px dashed hsl(250, 15%, 28%)",
          padding: "14px 16px",
        }}
      >
        <p
          style={{
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 8.5,
            color: mainQuestComplete ? "hsl(38, 85%, 60%)" : "hsl(250, 10%, 55%)",
            marginBottom: 8,
            lineHeight: 1.6,
          }}
        >
          {mainQuestComplete
            ? "👑 Reward Unlocked: Royal Cloak & Hire Me Scroll"
            : `🔒 Completion Reward (${totalLandmarks - visitedCount} left)`}
        </p>

        {!mainQuestComplete ? (
          <p style={{ ...modalText, fontSize: 13, opacity: 0.78 }}>
            Visit all 8 town landmarks to unlock the{" "}
            <strong style={{ color: "hsl(38, 85%, 62%)" }}>Emerald &amp; Gold Royal Cloak</strong>{" "}
            for your character and the{" "}
            <strong style={{ color: "hsl(38, 85%, 62%)" }}>Hire Me Commission Scroll</strong>.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 12px",
                background: "hsla(255, 20%, 10%, 0.6)",
                border: "1px solid hsla(38, 85%, 55%, 0.35)",
              }}
            >
              <span style={{ ...modalText, fontSize: 13.5 }}>
                🧥 <strong>Archmage-Rogue Royal Cloak</strong> — emerald &amp; gold trim in 3D
              </span>
              <button
                type="button"
                onClick={onToggleCloak}
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 8,
                  padding: "7px 10px",
                  cursor: "pointer",
                  background: cloakEquipped ? "hsl(150, 45%, 35%)" : "hsl(38, 85%, 55%)",
                  color: cloakEquipped ? "hsl(40, 25%, 94%)" : "hsl(255, 20%, 8%)",
                  border: "1px solid hsla(40, 25%, 80%, 0.3)",
                }}
              >
                {cloakEquipped ? "✓ Equipped" : "Equip Cloak"}
              </button>
            </div>

            <div
              style={{
                padding: "12px",
                background: "hsla(255, 20%, 10%, 0.65)",
                border: "1px solid hsla(38, 85%, 55%, 0.35)",
              }}
            >
              <p
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 8,
                  color: "hsl(38, 85%, 60%)",
                  marginBottom: 8,
                }}
              >
                📜 HIRE ME — OJT &amp; JUNIOR DEV COMMISSION
              </p>
              <p style={{ ...modalText, fontSize: 13.5, marginBottom: 10 }}>
                <strong>{personalInfo.name}</strong> is seeking an OJT / Junior Software or Web
                Developer role (TypeScript, React, PHP/Laravel, SQL, C++, Unity). Based in{" "}
                {personalInfo.location}.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <a
                  href={`mailto:${personalInfo.email}?subject=OJT%20%2F%20Developer%20Opportunity`}
                  style={{
                    padding: "7px 11px",
                    background: "hsl(38, 85%, 55%)",
                    color: "hsl(255, 20%, 8%)",
                    textDecoration: "none",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                >
                  ✉ Email Shealtiel
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  style={{
                    padding: "7px 11px",
                    background: "hsl(252, 16%, 16%)",
                    border: "1px solid hsl(250, 15%, 30%)",
                    color: "hsl(40, 25%, 88%)",
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11.5,
                  }}
                >
                  {copied ? "✓ Email Copied" : "Copy Email"}
                </button>
                <button
                  type="button"
                  onClick={onOpenQuickView}
                  style={{
                    padding: "7px 11px",
                    background: "hsl(252, 16%, 16%)",
                    border: "1px solid hsl(250, 15%, 30%)",
                    color: "hsl(150, 55%, 62%)",
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11.5,
                  }}
                >
                  📄 Plain Resume View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestLogModal;
