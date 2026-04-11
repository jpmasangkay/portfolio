import { repos } from "@/data/portfolio-data";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 75%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const QuestBoardModal = () => {
  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.8 }}>
        "Scrolls of ancient code, each containing powerful incantations. Choose your quest wisely..."
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
              el.style.boxShadow = "3px 3px 0 rgba(0,0,0,0.4), 0 0 10px hsla(38, 85%, 55%, 0.15)";
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
                color: "hsl(40, 25%, 85%)",
                marginBottom: 6,
                lineHeight: 1.6,
              }}
            >
              📜 {repo.title}
            </p>
            <p style={{ ...modalText, fontSize: 11, opacity: 0.6, marginBottom: 6 }}>
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
                    color: "hsl(270, 50%, 65%)",
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
