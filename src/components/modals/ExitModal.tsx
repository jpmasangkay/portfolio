import { personalInfo } from "@/data/portfolio-data";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 75%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const ExitModal = () => {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 36, marginBottom: 12 }}>🕊️</p>
      <p
        style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 10,
          color: "hsl(38, 85%, 55%)",
          marginBottom: 16,
          lineHeight: 2,
        }}
      >
        Leaving so soon?
      </p>
      <p style={{ ...modalText, marginBottom: 24, opacity: 0.8 }}>
        Before you depart, perhaps send a raven or visit the guild...
      </p>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, alignItems: "center" }}>
        <a
          href={personalInfo.github}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            background: "hsla(250, 15%, 15%, 0.6)",
            border: "2px solid hsl(250, 15%, 22%)",
            color: "hsl(40, 25%, 85%)",
            textDecoration: "none",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 8,
            boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            transition: "all 0.15s ease",
            width: "fit-content",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "hsl(38, 85%, 55%)";
            e.currentTarget.style.transform = "translate(-1px, -1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "hsl(250, 15%, 22%)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <span style={{ fontSize: 18 }}>🐦</span>
          Scribe's Guild (GitHub)
        </a>

        <a
          href={personalInfo.linkedin}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            background: "hsla(250, 15%, 15%, 0.6)",
            border: "2px solid hsl(250, 15%, 22%)",
            color: "hsl(40, 25%, 85%)",
            textDecoration: "none",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 8,
            boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            transition: "all 0.15s ease",
            width: "fit-content",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "hsl(38, 85%, 55%)";
            e.currentTarget.style.transform = "translate(-1px, -1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "hsl(250, 15%, 22%)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <span style={{ fontSize: 18 }}>📯</span>
          Herald's Network (LinkedIn)
        </a>

        <a
          href={`mailto:${personalInfo.email}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            background: "hsla(250, 15%, 15%, 0.6)",
            border: "2px solid hsl(250, 15%, 22%)",
            color: "hsl(40, 25%, 85%)",
            textDecoration: "none",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 8,
            boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            transition: "all 0.15s ease",
            width: "fit-content",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "hsl(38, 85%, 55%)";
            e.currentTarget.style.transform = "translate(-1px, -1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "hsl(250, 15%, 22%)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <span style={{ fontSize: 18 }}>🕊️</span>
          Send a Raven (Email)
        </a>
      </div>

      <p style={{ ...modalText, fontSize: 11, opacity: 0.4, marginTop: 24 }}>
        © 2026 Shealtiel John Paul A. Masangkay · All rights reserved
      </p>
    </div>
  );
};

export default ExitModal;
