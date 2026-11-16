import { projects, repos } from "@/data/portfolio-data";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 78%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "'Press Start 2P', cursive",
  fontSize: 8,
  color: "hsl(150, 45%, 52%)",
  letterSpacing: "0.14em",
  marginBottom: 10,
  textTransform: "uppercase" as const,
};

const QuestBoardModal = () => {
  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 18, opacity: 0.85 }}>
        &ldquo;Featured commissions and scrolls of ancient code. Choose your quest wisely...&rdquo;
      </p>

      {/* Featured Quests (from portfolio-data projects) */}
      <p style={sectionHeadingStyle}>⚔️ Featured Quests</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
          marginBottom: 22,
        }}
      >
        {projects.map((project) => (
          <div
            key={project.title}
            style={{
              background: "hsla(38, 35%, 14%, 0.42)",
              border: "1px solid hsla(38, 85%, 55%, 0.45)",
              padding: "12px 14px",
              boxShadow: "2px 2px 0 rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 8,
                  color: "hsl(38, 85%, 60%)",
                  marginBottom: 4,
                  lineHeight: 1.6,
                }}
              >
                {project.title}
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: "hsl(150, 50%, 55%)",
                  marginBottom: 6,
                }}
              >
                {project.tech} · {project.period}
              </p>
              <p style={{ ...modalText, fontSize: 12.5, lineHeight: 1.55 }}>
                {project.description}
              </p>
            </div>
            {project.href && (
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10.5,
                  color: "hsl(38, 85%, 62%)",
                  textDecoration: "none",
                  alignSelf: "flex-start",
                  borderBottom: "1px solid hsla(38, 85%, 62%, 0.4)",
                }}
              >
                View Repository ↗
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Repositories */}
      <p style={sectionHeadingStyle}>📜 Guild Commissions (GitHub Repos)</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        {repos.map((repo) => (
          <a
            key={repo.title}
            href={repo.href}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              background: "hsla(250, 15%, 15%, 0.6)",
              border: "2px solid hsl(250, 15%, 22%)",
              padding: "12px 14px",
              transition: "all 0.15s ease",
              textDecoration: "none",
              boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "hsl(38, 85%, 55%)";
              el.style.transform = "translate(-1px, -1px)";
              el.style.boxShadow =
                "3px 3px 0 rgba(0,0,0,0.4), 0 0 10px hsla(38, 85%, 55%, 0.15)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "hsl(250, 15%, 22%)";
              el.style.transform = "none";
              el.style.boxShadow = "2px 2px 0 rgba(0,0,0,0.3)";
            }}
          >
            <p
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 8,
                color: "hsl(40, 25%, 88%)",
                marginBottom: 6,
                lineHeight: 1.6,
              }}
            >
              📜 {repo.title} ↗
            </p>
            <p style={{ ...modalText, fontSize: 12, opacity: 0.78, marginBottom: 8, lineHeight: 1.5 }}>
              {repo.desc}
            </p>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const }}>
              {repo.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    padding: "2px 6px",
                    background: "hsla(250, 15%, 20%, 0.8)",
                    color: "hsl(270, 50%, 68%)",
                    border: "1px solid hsl(250, 15%, 28%)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default QuestBoardModal;
