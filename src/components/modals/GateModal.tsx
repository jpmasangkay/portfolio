import { personalInfo } from "@/data/portfolio-data";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 75%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const GateModal = () => {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🏰</p>
      <p
        style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 12,
          color: "hsl(38, 85%, 55%)",
          textShadow: "0 0 10px hsla(38, 85%, 55%, 0.3)",
          marginBottom: 8,
          lineHeight: 2,
        }}
      >
        Welcome, Traveler!
      </p>
      <p style={{ ...modalText, marginBottom: 20, opacity: 0.8 }}>
        You have entered the shadowed domain of <strong style={{ color: "hsl(38, 85%, 55%)" }}>Shealtiel John Paul A. Masangkay</strong>,
        a rogue-class developer who moves through code like shadows — from the realm of {personalInfo.location}.
      </p>
      <p style={{ ...modalText, fontStyle: "italic", opacity: 0.6, marginBottom: 24 }}>
        Explore the buildings to discover the rogue's skills, past contracts, and creations.
        Use WASD to move and press E near buildings to interact.
      </p>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" as const }}>
        <span style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 7,
          padding: "6px 12px",
          background: "hsla(250, 15%, 15%, 0.6)",
          border: "1px solid hsl(250, 15%, 22%)",
          color: "hsl(250, 10%, 50%)",
        }}>
          🍺 Tavern = About
        </span>
        <span style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 7,
          padding: "6px 12px",
          background: "hsla(250, 15%, 15%, 0.6)",
          border: "1px solid hsl(250, 15%, 22%)",
          color: "hsl(250, 10%, 50%)",
        }}>
          📜 Quest Board = Repos
        </span>
        <span style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 7,
          padding: "6px 12px",
          background: "hsla(250, 15%, 15%, 0.6)",
          border: "1px solid hsl(250, 15%, 22%)",
          color: "hsl(250, 10%, 50%)",
        }}>
          🧙 Tower = Skills
        </span>
      </div>
    </div>
  );
};

export default GateModal;
