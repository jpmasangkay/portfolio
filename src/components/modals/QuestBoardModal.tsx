import { useMemo, useState } from "react";
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
  const [selectedTag, setSelectedTag] = useState<string>("All");

  const repoTags = useMemo(() => {
    const set = new Set<string>();
    for (const r of repos) {
      for (const t of r.tags) set.add(t);
    }
    return ["All", ...Array.from(set)];
  }, []);

  const filteredRepos = useMemo(
    () =>
      selectedTag === "All"
        ? repos
        : repos.filter((r) => r.tags.includes(selectedTag)),
    [selectedTag]
  );

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
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
              gap: 10,
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
              <p style={{ ...modalText, fontSize: 12.5, lineHeight: 1.55, marginBottom: 6 }}>
                {project.description}
              </p>
              {project.highlights && project.highlights.length > 0 && (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 16,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    color: "hsl(40, 15%, 76%)",
                    display: "grid",
                    gap: 3,
                  }}
                >
                  {project.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
              {project.href && (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className="qb-link"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10.5,
                    color: "hsl(38, 85%, 62%)",
                    textDecoration: "none",
                    borderBottom: "1px solid hsla(38, 85%, 62%, 0.4)",
                  }}
                >
                  View Repository ↗
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="qb-link"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10.5,
                    color: "hsl(150, 55%, 62%)",
                    textDecoration: "none",
                    borderBottom: "1px solid hsla(150, 55%, 62%, 0.4)",
                  }}
                >
                  Live Demo ↗
                </a>
              )}
              {project.badge && (
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: "hsl(150, 50%, 60%)",
                  }}
                >
                  {project.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Repositories Header + Tag Filter */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <p style={{ ...sectionHeadingStyle, marginBottom: 0 }}>
          📜 Guild Commissions (GitHub Repos)
        </p>
        <div
          role="group"
          aria-label="Filter guild commissions by technology"
          style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
        >
          {repoTags.map((tag) => {
            const active = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedTag(tag)}
                className="qb-filter-btn"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  padding: "3px 7px",
                  minHeight: 24,
                  cursor: "pointer",
                  background: active ? "hsl(38, 85%, 55%)" : "hsla(250, 15%, 16%, 0.75)",
                  color: active ? "hsl(255, 20%, 8%)" : "hsl(40, 20%, 80%)",
                  border: active
                    ? "1px solid hsl(38, 90%, 65%)"
                    : "1px solid hsl(250, 15%, 26%)",
                  fontWeight: active ? 700 : 400,
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        {filteredRepos.map((repo) => (
          <a
            key={repo.title}
            href={repo.href}
            target="_blank"
            rel="noreferrer"
            className="qb-repo-card"
            style={{
              display: "block",
              background: "hsla(250, 15%, 15%, 0.6)",
              border: "1px solid hsl(250, 15%, 24%)",
              padding: "12px 14px",
              textDecoration: "none",
              boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
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

      <style>{`
        .qb-repo-card,
        .qb-filter-btn {
          transition: border-color 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .qb-repo-card:hover,
        .qb-repo-card:focus-visible {
          border-color: hsl(38, 85%, 55%) !important;
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 rgba(0,0,0,0.4), 0 0 10px hsla(38, 85%, 55%, 0.15) !important;
        }
        .qb-repo-card:active,
        .qb-filter-btn:active {
          transform: scale(0.98);
        }
        .qb-filter-btn:hover {
          border-color: hsl(38, 85%, 55%) !important;
        }
        .qb-repo-card:focus-visible,
        .qb-filter-btn:focus-visible,
        .qb-link:focus-visible {
          outline: 2px solid hsl(38, 85%, 55%);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default QuestBoardModal;
