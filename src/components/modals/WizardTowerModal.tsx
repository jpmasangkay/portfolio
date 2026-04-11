import { skills } from "@/data/portfolio-data";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 75%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Press Start 2P', cursive",
  fontSize: 7,
  color: "hsl(150, 40%, 45%)",
  letterSpacing: "0.15em",
  marginBottom: 10,
  textTransform: "uppercase" as const,
};

interface StatBarProps {
  name: string;
  level: number;
  maxLevel: number;
  color: string;
  glowColor: string;
}

const StatBar = ({ name, level, maxLevel, color, glowColor }: StatBarProps) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
    <span
      style={{
        fontFamily: "'Press Start 2P', cursive",
        fontSize: 7,
        color: "hsl(250, 10%, 50%)",
        width: 80,
        textAlign: "right",
      }}
    >
      {name}
    </span>
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: maxLevel }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 14,
            border: "1px solid hsl(250, 15%, 28%)",
            background: i < level ? color : "hsl(250, 12%, 15%)",
            boxShadow: i < level ? `0 0 5px ${glowColor}` : "none",
            transition: "all 0.3s ease",
            transitionDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  </div>
);

const WizardTowerModal = () => {
  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.8 }}>
        "The wizard's tomes reveal the arcane proficiencies accumulated through years of study..."
      </p>

      {/* Intermediate (High proficiency) */}
      <p style={labelStyle}>✨ Advanced Incantations</p>
      {skills.intermediate.map((skill) => (
        <StatBar
          key={skill}
          name={skill}
          level={4}
          maxLevel={5}
          color="hsl(38, 85%, 55%)"
          glowColor="hsla(38, 85%, 55%, 0.4)"
        />
      ))}

      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, hsl(30, 25%, 28%), transparent)", margin: "16px 0" }} />

      {/* Beginner */}
      <p style={labelStyle}>📖 Studied Arts</p>
      {skills.beginner.map((skill) => (
        <StatBar
          key={skill}
          name={skill}
          level={2}
          maxLevel={5}
          color="hsl(150, 40%, 38%)"
          glowColor="hsla(150, 40%, 38%, 0.4)"
        />
      ))}

      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, hsl(30, 25%, 28%), transparent)", margin: "16px 0" }} />

      {/* Tools */}
      <p style={labelStyle}>🛠️ Enchanted Tools</p>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
        {skills.tools.map((tool) => (
          <span
            key={tool}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              padding: "4px 10px",
              background: "hsla(270, 30%, 20%, 0.5)",
              color: "hsl(270, 50%, 65%)",
              border: "1px solid hsl(270, 30%, 30%)",
              boxShadow: "0 0 6px hsla(270, 50%, 55%, 0.15)",
            }}
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WizardTowerModal;
