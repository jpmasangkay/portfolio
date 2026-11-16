import { personalInfo, skills } from "@/data/portfolio-data";

export interface WizardTowerModalProps {
  level?: number;
  xp?: number;
  title?: string;
  nextLevelXp?: number | null;
  visitedCount?: number;
  secretsFoundCount?: number;
}

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Press Start 2P', cursive",
  fontSize: 8,
  color: "hsl(38, 85%, 55%)",
  letterSpacing: "0.1em",
  marginBottom: 10,
  textTransform: "uppercase" as const,
};

const CORE_ATTRIBUTES = [
  { code: "WEB", name: "Frontend & UI", score: 17, mod: "+3", focus: "React, TypeScript, Tailwind" },
  { code: "SRV", name: "Backend & SQL", score: 16, mod: "+3", focus: "PHP, MySQL, Laravel" },
  { code: "3D", name: "Game & 3D Art", score: 15, mod: "+2", focus: "Three.js, Unity C#, Blender" },
  { code: "SYS", name: "CS Foundations", score: 15, mod: "+2", focus: "C++, Java, Kotlin, Git" },
];

const WizardTowerModal = ({
  level = 1,
  xp = 0,
  title = "Novice Wanderer",
  nextLevelXp = 150,
  visitedCount = 0,
  secretsFoundCount = 0,
}: WizardTowerModalProps) => {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Character Sheet Header Banner */}
      <div
        style={{
          background: "hsla(252, 20%, 12%, 0.9)",
          border: "1px solid hsla(38, 85%, 55%, 0.45)",
          padding: "14px 16px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 8.5,
              color: "hsl(38, 85%, 60%)",
              marginBottom: 4,
            }}
          >
            CHARACTER SHEET · {personalInfo.name.toUpperCase()}
          </p>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13.5,
              color: "hsl(40, 25%, 82%)",
            }}
          >
            Class: <strong style={{ color: "hsl(150, 50%, 62%)" }}>Full-Stack Technomancer</strong> · Rank: {title}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
          }}
        >
          <span
            style={{
              padding: "4px 9px",
              border: "1px solid hsl(250, 15%, 28%)",
              background: "hsl(252, 18%, 14%)",
              color: "hsl(38, 85%, 62%)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            LV {level}
          </span>
          <span
            style={{
              padding: "4px 9px",
              border: "1px solid hsl(250, 15%, 28%)",
              background: "hsl(252, 18%, 14%)",
              color: "hsl(150, 55%, 62%)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {nextLevelXp ? `${xp}/${nextLevelXp} XP` : `${xp} XP (MAX)`}
          </span>
        </div>
      </div>

      {/* Core Attributes Grid */}
      <div>
        <p style={sectionHeading}>CORE ATTRIBUTES</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 8,
          }}
        >
          {CORE_ATTRIBUTES.map((attr) => (
            <div
              key={attr.code}
              style={{
                background: "hsla(252, 18%, 13%, 0.85)",
                border: "1px solid hsl(250, 15%, 25%)",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: 8,
                    color: "hsl(38, 85%, 58%)",
                  }}
                >
                  {attr.code}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "hsl(150, 55%, 62%)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {attr.score} ({attr.mod})
                </span>
              </div>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "hsl(40, 25%, 88%)" }}>
                {attr.name}
              </p>
              <p style={{ fontSize: 11.5, color: "hsl(250, 10%, 62%)", marginTop: 2 }}>
                {attr.focus}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Proficiencies */}
      <div
        style={{
          background: "hsla(252, 18%, 11%, 0.7)",
          border: "1px solid hsl(250, 15%, 24%)",
          padding: "12px 14px",
        }}
      >
        <p style={sectionHeading}>✨ Proficient Spellbook (Intermediate)</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
            gap: 8,
          }}
        >
          {skills.intermediate.map((skill) => (
            <div
              key={skill}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                background: "hsl(252, 18%, 14%)",
                border: "1px solid hsl(250, 15%, 24%)",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "hsl(40, 25%, 90%)" }}>
                {skill}
              </span>
              <span
                aria-label="4 of 5 proficiency pips"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "hsl(38, 85%, 60%)",
                }}
              >
                ■■■■□
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Familiar / Studied Languages */}
      <div
        style={{
          background: "hsla(252, 18%, 11%, 0.7)",
          border: "1px solid hsl(250, 15%, 24%)",
          padding: "12px 14px",
        }}
      >
        <p style={sectionHeading}>📖 Apprentice Cantrips (Beginner / Studied)</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
            gap: 8,
          }}
        >
          {skills.beginner.map((skill) => (
            <div
              key={skill}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                background: "hsl(252, 18%, 14%)",
                border: "1px solid hsl(250, 15%, 24%)",
              }}
            >
              <span style={{ fontSize: 13, color: "hsl(40, 20%, 84%)" }}>{skill}</span>
              <span
                aria-label="2 of 5 proficiency pips"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: "hsl(150, 48%, 55%)",
                }}
              >
                ■■□□□
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment & Arcane Tools */}
      <div
        style={{
          background: "hsla(252, 18%, 11%, 0.7)",
          border: "1px solid hsl(250, 15%, 24%)",
          padding: "12px 14px",
        }}
      >
        <p style={sectionHeading}>🛠️ Equipped Arcane Tools &amp; Party Progress</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {skills.tools.map((tool) => (
            <span
              key={tool}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11.5,
                color: "hsl(40, 25%, 86%)",
                background: "hsl(252, 18%, 15%)",
                border: "1px solid hsl(250, 15%, 28%)",
                padding: "4px 9px",
              }}
            >
              {tool}
            </span>
          ))}
        </div>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11.5,
            color: "hsl(250, 12%, 68%)",
          }}
        >
          Realm Log: {visitedCount}/8 landmarks discovered · {secretsFoundCount}/5 hidden curiosities found
        </p>
      </div>
    </div>
  );
};

export default WizardTowerModal;
