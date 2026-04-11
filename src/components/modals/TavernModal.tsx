import { personalInfo, education, experience } from "@/data/portfolio-data";

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
  marginBottom: 4,
  textTransform: "uppercase" as const,
};

const valueStyle: React.CSSProperties = {
  ...modalText,
  color: "hsl(40, 25%, 85%)",
  marginBottom: 16,
};

const TavernModal = () => {
  return (
    <div>
      {/* Intro */}
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.8 }}>
        *The hooded figure leans in from the shadows and slides a worn dossier across the table...*
      </p>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div>
          <p style={labelStyle}>🗡️ Name</p>
          <p style={valueStyle}>{personalInfo.name}</p>
        </div>
        <div>
          <p style={labelStyle}>🏰 Homeland</p>
          <p style={valueStyle}>{personalInfo.location}</p>
        </div>
        <div>
          <p style={labelStyle}>⚔️ Current Quest</p>
          <p style={valueStyle}>{personalInfo.objective}</p>
        </div>
        <div>
          <p style={labelStyle}>📧 Raven Address</p>
          <p style={valueStyle}>{personalInfo.email}</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, hsl(30, 25%, 28%), transparent)", margin: "20px 0" }} />

      {/* Experience */}
      <p style={{ ...labelStyle, marginBottom: 12 }}>⚔️ Quest History</p>
      {experience.map((exp, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          <p style={{ ...modalText, color: "hsl(38, 85%, 55%)", fontWeight: "bold", marginBottom: 4 }}>
            {exp.title} — {exp.company}
          </p>
          <p style={{ ...modalText, fontSize: 12, opacity: 0.6, marginBottom: 8 }}>{exp.period}</p>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {exp.duties.map((duty, j) => (
              <li key={j} style={{ ...modalText, fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "hsl(38, 85%, 55%)", fontSize: 10 }}>► </span>
                {duty}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Divider */}
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, hsl(30, 25%, 28%), transparent)", margin: "20px 0" }} />

      {/* Education */}
      <p style={{ ...labelStyle, marginBottom: 12 }}>📚 Training History</p>
      {education.map((edu, i) => (
        <div key={i} style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <p style={{ ...modalText, color: "hsl(40, 25%, 85%)" }}>{edu.degree}</p>
            <p style={{ ...modalText, fontSize: 12, opacity: 0.6 }}>{edu.school}</p>
          </div>
          <p style={{ ...modalText, fontSize: 11, color: "hsl(150, 40%, 45%)", whiteSpace: "nowrap", marginLeft: 12 }}>
            {edu.years}
          </p>
        </div>
      ))}
    </div>
  );
};

export default TavernModal;
