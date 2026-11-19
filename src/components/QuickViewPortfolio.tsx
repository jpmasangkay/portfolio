import { useMemo, useRef, useState } from "react";
import {
  certificates,
  education,
  experience,
  personalInfo,
  projects,
  repos,
  skills,
} from "@/data/portfolio-data";
import { forgeWorks, galleryMagazines, galleryPosters } from "@/data/media-works";
import ImageLightbox, { type LightboxImage } from "@/components/ImageLightbox";
import MediaThumbnail from "@/components/MediaThumbnail";

interface QuickViewPortfolioProps {
  onBackToWorld: () => void;
}

const sectionCardStyle: React.CSSProperties = {
  background: "hsl(252, 18%, 11%)",
  border: "1px solid hsl(250, 15%, 22%)",
  padding: "20px",
  scrollMarginTop: 118,
};

function legacyClipboardCopy(text: string): boolean {
  try {
    const field = Object.assign(document.createElement("textarea"), { value: text });
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
    document.body.append(field);
    field.select();
    try {
      return document.execCommand("copy");
    } finally {
      field.remove();
    }
  } catch {
    return false;
  }
}

const QuickViewPortfolio = ({ onBackToWorld }: QuickViewPortfolioProps) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [copyAnnouncement, setCopyAnnouncement] = useState<string>("");
  const copyTimerRef = useRef<number | null>(null);
  const lastAnnouncedRef = useRef<string>("");
  const resumeHref = `${import.meta.env.BASE_URL}${personalInfo.resumePdf}`;

  const projectPreviewItems = useMemo(
    () =>
      projects
        .filter((p) => Boolean(p.previewImage))
        .map((p) => ({
          title: p.title,
          src: `${import.meta.env.BASE_URL}${p.previewImage}`,
          alt: `${p.title} preview`,
          description: p.description,
        })),
    []
  );

  const allMediaImages: LightboxImage[] = useMemo(
    () => [
      ...[...galleryPosters, ...galleryMagazines].map((item) => ({
        src: item.image,
        alt: item.title,
        title: item.title,
        description: item.description,
      })),
      ...forgeWorks.map((w) => ({
        src: w.image,
        alt: w.alt,
        title: w.title,
        description: w.description,
      })),
      ...projectPreviewItems,
    ],
    [projectPreviewItems]
  );
  const galleryOffset = galleryPosters.length + galleryMagazines.length;
  const projectPreviewOffset = galleryOffset + forgeWorks.length;

  const repoTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of repos) {
      for (const t of r.tags) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return ["All", ...Array.from(counts.keys())];
  }, []);

  const filteredRepos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return repos.filter((repo) => {
      const matchesTag = selectedTag === "All" || repo.tags.includes(selectedTag);
      const matchesQuery =
        !q ||
        repo.title.toLowerCase().includes(q) ||
        repo.desc.toLowerCase().includes(q) ||
        repo.tags.some((t) => t.toLowerCase().includes(q));
      return matchesTag && matchesQuery;
    });
  }, [selectedTag, searchQuery]);

  const handleCopyEmail = async () => {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }

    let ok = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(personalInfo.email);
        ok = true;
      } else {
        ok = legacyClipboardCopy(personalInfo.email);
      }
    } catch {
      ok = legacyClipboardCopy(personalInfo.email);
    }

    let message = ok ? "Copied" : "Copy failed";
    if (message === lastAnnouncedRef.current) {
      message += "\u00A0";
    }
    lastAnnouncedRef.current = message;

    setCopyState(ok ? "copied" : "failed");
    setCopyAnnouncement(message);

    copyTimerRef.current = window.setTimeout(() => {
      setCopyState("idle");
      setCopyAnnouncement("");
    }, 2000);
  };

  const handlePrintResume = () => {
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
  };

  return (
    <div
      id="quick-view-page"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        overflowY: "auto",
        background: "hsl(255, 20%, 7%)",
        color: "hsl(40, 25%, 88%)",
        fontFamily: "'Space Grotesk', sans-serif",
        userSelect: "text",
        WebkitUserSelect: "text",
      }}
    >
      <a href="#qv-main-heading" className="qv-skip-link">
        Skip to main content
      </a>

      {/* Top sticky bar */}
      <header
        className="qv-sticky-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "hsla(255, 20%, 8%, 0.94)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid hsl(250, 15%, 20%)",
        }}
      >
        <div
          className="qv-header-inner"
          style={{
            maxWidth: 1020,
            margin: "0 auto",
            padding: "12px 16px",
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
                fontSize: "10px",
                color: "hsl(38, 85%, 55%)",
                marginBottom: 4,
              }}
            >
              {personalInfo.name}
            </p>
            <p style={{ fontSize: 13, color: "hsl(250, 10%, 65%)" }}>
              Computer Science Student &amp; Web Developer · {personalInfo.location}
            </p>
          </div>
          <div className="qv-no-print" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <a
              href={resumeHref}
              download={personalInfo.resumePdf}
              className="qv-action-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                color: "hsl(150, 55%, 62%)",
                background: "hsl(252, 18%, 13%)",
                border: "1px solid hsla(150, 45%, 42%, 0.55)",
                padding: "9px 12px",
                textDecoration: "none",
                minHeight: 40,
              }}
            >
              ⬇ Download Resume (PDF)
            </a>
            <button
              type="button"
              onClick={handlePrintResume}
              className="qv-action-btn"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                color: "hsl(40, 25%, 88%)",
                background: "hsl(252, 18%, 13%)",
                border: "1px solid hsl(250, 15%, 26%)",
                padding: "9px 12px",
                cursor: "pointer",
                minHeight: 40,
              }}
            >
              🖨️ Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onBackToWorld}
              className="qv-primary-btn"
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: "9px",
                color: "hsl(255, 20%, 8%)",
                background: "hsl(38, 85%, 55%)",
                border: "1px solid hsl(38, 90%, 65%)",
                padding: "10px 14px",
                cursor: "pointer",
                minHeight: 40,
              }}
            >
              🎮 Back to 3D Realm
            </button>
          </div>
        </div>

        <nav
          aria-label="Portfolio sections"
          className="qv-no-print"
          style={{
            maxWidth: 1020,
            margin: "0 auto",
            padding: "0 16px 10px",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            fontSize: 13,
          }}
        >
          {[
            ["#qv-about", "About"],
            ["#qv-projects", "Projects & Repos"],
            ["#qv-skills", "Skills"],
            ["#qv-gallery", "Gallery"],
            ["#qv-forge", "3D Work"],
            ["#qv-certs", "Certificates"],
            ["#qv-contact", "Contact"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="qv-nav-link"
              style={{
                color: "hsl(40, 20%, 78%)",
                textDecoration: "none",
                padding: "4px 9px",
                border: "1px solid hsl(250, 15%, 22%)",
                background: "hsl(252, 18%, 12%)",
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main
        style={{
          maxWidth: 1020,
          margin: "0 auto",
          padding: "24px 16px 48px",
          display: "grid",
          gap: 20,
        }}
      >
        {/* About + Experience + Education */}
        <section id="qv-about" aria-labelledby="qv-main-heading" style={sectionCardStyle}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <h1
              id="qv-main-heading"
              tabIndex={-1}
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 13,
                color: "hsl(38, 85%, 55%)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              About &amp; Background
            </h1>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11.5,
                color: "hsl(150, 55%, 62%)",
                background: "hsla(150, 35%, 14%, 0.45)",
                border: "1px solid hsla(150, 45%, 42%, 0.55)",
                padding: "4px 10px",
              }}
            >
              ● Open for OJT / Internship
            </span>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.65, marginBottom: 16 }}>
            {personalInfo.objective}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 20,
              fontSize: 14,
              padding: "12px 14px",
              background: "hsl(252, 16%, 13%)",
              border: "1px solid hsl(250, 15%, 20%)",
            }}
          >
            <div>
              <strong style={{ color: "hsl(150, 45%, 55%)" }}>Location:</strong>{" "}
              {personalInfo.location}
            </div>
            <div>
              <strong style={{ color: "hsl(150, 45%, 55%)" }}>Phone:</strong>{" "}
              <a
                href={`tel:${personalInfo.phone.replace(/\s+/g, "")}`}
                style={{ color: "hsl(40, 25%, 88%)", textDecoration: "none" }}
              >
                {personalInfo.phone}
              </a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", gridColumn: "1 / -1" }}>
              <strong style={{ color: "hsl(150, 45%, 55%)" }}>Email:</strong>{" "}
              <a
                href={`mailto:${personalInfo.email}`}
                style={{ color: "hsl(38, 85%, 62%)", wordBreak: "break-all" }}
              >
                {personalInfo.email}
              </a>
              <span className="qv-copy-wrap qv-no-print" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  aria-label="Copy email address"
                  data-copied={copyState === "copied" ? "" : undefined}
                  data-failed={copyState === "failed" ? "" : undefined}
                  className="qv-action-btn"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    padding: "3px 8px",
                    minWidth: 24,
                    minHeight: 24,
                    background: "hsl(252, 18%, 16%)",
                    border:
                      copyState === "copied"
                        ? "1px solid hsl(150, 55%, 50%)"
                        : copyState === "failed"
                        ? "1px solid hsl(0, 65%, 55%)"
                        : "1px solid hsl(250, 15%, 28%)",
                    color:
                      copyState === "copied"
                        ? "hsl(150, 60%, 65%)"
                        : copyState === "failed"
                        ? "hsl(0, 75%, 70%)"
                        : "hsl(40, 25%, 86%)",
                    cursor: "pointer",
                  }}
                >
                  <span aria-hidden="true">
                    {copyState === "copied" ? "✓" : copyState === "failed" ? "✕" : "⧉"}
                  </span>{" "}
                  {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy Email"}
                </button>
                <span
                  role="status"
                  aria-live="polite"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: copyState === "failed" ? "hsl(0, 75%, 70%)" : "hsl(150, 60%, 62%)",
                    opacity: copyAnnouncement ? 1 : 0,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  {copyAnnouncement}
                </span>
              </span>
            </div>
          </div>

          <h2
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 10,
              color: "hsl(150, 45%, 55%)",
              marginBottom: 10,
            }}
          >
            Experience
          </h2>
          {experience.map((exp) => (
            <div key={exp.title} style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 600, color: "hsl(38, 85%, 60%)" }}>
                {exp.title} — {exp.company}{" "}
                <span style={{ color: "hsl(250, 10%, 60%)", fontWeight: 400 }}>
                  ({exp.period})
                </span>
              </p>
              <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.65, fontSize: 14 }}>
                {exp.duties.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          ))}

          <h2
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 10,
              color: "hsl(150, 45%, 55%)",
              margin: "16px 0 10px",
            }}
          >
            Education
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {education.map((edu) => (
              <div
                key={edu.degree}
                style={{
                  paddingBottom: 10,
                  borderBottom: "1px solid hsl(250, 15%, 18%)",
                  fontSize: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: edu.details ? 4 : 0,
                  }}
                >
                  <div>
                    <strong>{edu.degree}</strong> — {edu.school}
                  </div>
                  <span style={{ color: "hsl(150, 45%, 55%)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                    {edu.years}
                  </span>
                </div>
                {edu.details && (
                  <p style={{ fontSize: 13, color: "hsl(250, 10%, 68%)", lineHeight: 1.55, margin: 0 }}>
                    {edu.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Featured Projects & Repositories */}
        <section id="qv-projects" aria-labelledby="qv-projects-heading" style={sectionCardStyle}>
          <h2
            id="qv-projects-heading"
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 12,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 14,
            }}
          >
            Featured Projects
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
              marginBottom: 26,
            }}
          >
            {projects.map((proj) => {
              const previewIdx = proj.previewImage
                ? projectPreviewItems.findIndex((p) => p.title === proj.title)
                : -1;
              return (
                <article
                  key={proj.title}
                  className="qv-surface-card"
                  style={{
                    background: "hsl(252, 16%, 14%)",
                    border: "1px solid hsl(250, 15%, 24%)",
                    padding: 15,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    {proj.previewImage && previewIdx >= 0 && (
                      <button
                        type="button"
                        onClick={() => setLightboxIdx(projectPreviewOffset + previewIdx)}
                        aria-label={`Inspect ${proj.title} preview`}
                        className="qv-media-btn qv-no-print"
                        style={{
                          display: "block",
                          width: "100%",
                          padding: 0,
                          background: "none",
                          border: "1px solid hsl(250, 15%, 24%)",
                          cursor: "zoom-in",
                          marginBottom: 10,
                        }}
                      >
                        <MediaThumbnail
                          src={`${import.meta.env.BASE_URL}${proj.previewImage}`}
                          alt={`${proj.title} preview`}
                          aspectHint="16 / 9"
                        />
                      </button>
                    )}
                    <p style={{ fontWeight: 600, fontSize: 15, color: "hsl(38, 85%, 60%)", marginBottom: 4 }}>
                      {proj.title}
                    </p>
                    <p
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: "hsl(150, 45%, 55%)",
                        marginBottom: 8,
                      }}
                    >
                      {proj.tech} · {proj.period}
                    </p>
                    <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "hsl(40, 20%, 84%)", marginBottom: 8 }}>
                      {proj.description}
                    </p>
                    {proj.highlights && proj.highlights.length > 0 && (
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 18,
                          fontSize: 12.5,
                          lineHeight: 1.55,
                          color: "hsl(250, 12%, 72%)",
                          display: "grid",
                          gap: 4,
                        }}
                      >
                        {proj.highlights.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                    {proj.href && (
                      <a
                        href={proj.href}
                        target="_blank"
                        rel="noreferrer"
                        className="qv-inline-link"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11.5,
                          color: "hsl(38, 85%, 62%)",
                          textDecoration: "none",
                          borderBottom: "1px solid hsla(38, 85%, 62%, 0.4)",
                          paddingBottom: 1,
                        }}
                      >
                        View Source on GitHub ↗
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="qv-inline-link"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11.5,
                          color: "hsl(150, 55%, 62%)",
                          textDecoration: "none",
                          borderBottom: "1px solid hsla(150, 55%, 62%, 0.4)",
                          paddingBottom: 1,
                        }}
                      >
                        Live Demo ↗
                      </a>
                    )}
                    {proj.badge && (
                      <span
                        style={{
                          display: "inline-block",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: "hsl(150, 50%, 62%)",
                          background: "hsla(150, 35%, 14%, 0.4)",
                          border: "1px solid hsla(150, 40%, 36%, 0.5)",
                          padding: "2px 7px",
                        }}
                      >
                        {proj.badge}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <h3
              style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 10,
                color: "hsl(150, 45%, 55%)",
                margin: 0,
              }}
            >
              GitHub Repositories
            </h3>

            {/* Filter & Search controls */}
            <div
              className="qv-no-print"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 6,
              }}
            >
              <label htmlFor="qv-repo-search" className="qv-visually-hidden">
                Search repositories
              </label>
              <input
                id="qv-repo-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repos..."
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11.5,
                  padding: "4px 9px",
                  minHeight: 28,
                  background: "hsl(252, 18%, 10%)",
                  border: "1px solid hsl(250, 15%, 24%)",
                  color: "hsl(40, 25%, 88%)",
                  width: 150,
                }}
              />
              <div
                role="group"
                aria-label="Filter repositories by technology"
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
                      className="qv-tag-btn"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        padding: "4px 8px",
                        minHeight: 28,
                        cursor: "pointer",
                        background: active ? "hsl(38, 85%, 55%)" : "hsl(252, 16%, 13%)",
                        color: active ? "hsl(255, 20%, 8%)" : "hsl(40, 20%, 80%)",
                        border: active
                          ? "1px solid hsl(38, 90%, 65%)"
                          : "1px solid hsl(250, 15%, 24%)",
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredRepos.length === 0 ? (
            <div
              role="status"
              style={{
                padding: "24px 16px",
                textAlign: "center",
                background: "hsl(252, 16%, 13%)",
                border: "1px dashed hsl(250, 15%, 25%)",
              }}
            >
              <p style={{ fontSize: 14, color: "hsl(250, 10%, 68%)", marginBottom: 10 }}>
                No repositories match the current filter ({selectedTag}
                {searchQuery ? ` · "${searchQuery}"` : ""}).
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTag("All");
                  setSearchQuery("");
                }}
                className="qv-action-btn"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11.5,
                  padding: "6px 12px",
                  background: "hsl(252, 18%, 16%)",
                  border: "1px solid hsl(38, 85%, 55%)",
                  color: "hsl(38, 85%, 60%)",
                  cursor: "pointer",
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
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
                  className="qv-interactive-card"
                  style={{
                    display: "block",
                    padding: 12,
                    background: "hsl(252, 16%, 13%)",
                    border: "1px solid hsl(250, 15%, 22%)",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {repo.title} ↗
                  </p>
                  <p style={{ fontSize: 12.5, color: "hsl(250, 10%, 66%)", marginBottom: 6 }}>
                    {repo.desc}
                  </p>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      color: "hsl(38, 85%, 60%)",
                    }}
                  >
                    {repo.tags.join(" · ")}
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Skills */}
        <section
          id="qv-skills"
          tabIndex={0}
          aria-labelledby="qv-skills-heading"
          className="qv-focus-section"
          style={sectionCardStyle}
        >
          <h2
            id="qv-skills-heading"
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 12,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 14,
            }}
          >
            Technical Skills
          </h2>
          <div style={{ display: "grid", gap: 14, fontSize: 14 }}>
            <div>
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: "hsl(38, 85%, 60%)" }}>Proficient:</strong>{" "}
                <span>{skills.intermediate.join(", ")}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.intermediate.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11.5,
                      padding: "3px 9px",
                      background: "hsla(38, 45%, 16%, 0.4)",
                      border: "1px solid hsla(38, 85%, 55%, 0.45)",
                      color: "hsl(40, 25%, 90%)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: "hsl(150, 45%, 55%)" }}>Familiar / Studied:</strong>{" "}
                <span>{skills.beginner.join(", ")}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.beginner.map((s) => (
                  <span
                    key={s}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11.5,
                      padding: "3px 9px",
                      background: "hsl(252, 16%, 14%)",
                      border: "1px solid hsl(250, 15%, 24%)",
                      color: "hsl(40, 20%, 84%)",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: "hsl(250, 35%, 75%)" }}>Tools:</strong>{" "}
                <span>{skills.tools.join(", ")}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.tools.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11.5,
                      padding: "3px 9px",
                      background: "hsl(252, 16%, 14%)",
                      border: "1px solid hsl(250, 15%, 24%)",
                      color: "hsl(40, 20%, 84%)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Gallery & 3D Work */}
        <section id="qv-gallery" aria-labelledby="qv-gallery-heading" style={sectionCardStyle}>
          <h2
            id="qv-gallery-heading"
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 12,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 14,
            }}
          >
            Design &amp; Editorial Artwork
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {[...galleryPosters, ...galleryMagazines].map((item, i) => (
              <figure
                key={item.title}
                className="qv-surface-card"
                style={{
                  background: "hsl(252, 16%, 13%)",
                  border: "1px solid hsl(250, 15%, 22%)",
                  padding: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  aria-label={`Inspect ${item.title}`}
                  className="qv-media-btn"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: 0,
                    background: "none",
                    border: "none",
                    cursor: "zoom-in",
                    marginBottom: 8,
                  }}
                >
                  <MediaThumbnail
                    src={item.image}
                    alt={item.title}
                    aspectHint={item.category === "poster" ? "3 / 4" : "16 / 10"}
                  />
                </button>
                <figcaption style={{ fontSize: 13 }}>
                  <strong>{item.title}</strong> —{" "}
                  <span style={{ color: "hsl(250, 10%, 66%)" }}>{item.description}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="qv-forge" aria-labelledby="qv-forge-heading" style={sectionCardStyle}>
          <h2
            id="qv-forge-heading"
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 12,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 14,
            }}
          >
            3D Work (Blender)
          </h2>
          {forgeWorks.map((work, i) => (
            <figure
              key={work.title}
              className="qv-surface-card"
              style={{
                background: "hsl(252, 16%, 13%)",
                border: "1px solid hsl(250, 15%, 22%)",
                padding: 12,
              }}
            >
              <button
                type="button"
                onClick={() => setLightboxIdx(galleryOffset + i)}
                aria-label={`Inspect ${work.title}`}
                className="qv-media-btn"
                style={{
                  display: "block",
                  width: "100%",
                  padding: 0,
                  background: "none",
                  border: "none",
                  cursor: "zoom-in",
                  marginBottom: 10,
                }}
              >
                <MediaThumbnail src={work.image} alt={work.alt} aspectHint="16 / 9" />
              </button>
              <figcaption style={{ fontSize: 14, lineHeight: 1.6 }}>
                <strong>{work.title}</strong> — {work.description}
              </figcaption>
            </figure>
          ))}
        </section>

        {/* Certificates */}
        <section id="qv-certs" aria-labelledby="qv-certs-heading" style={sectionCardStyle}>
          <h2
            id="qv-certs-heading"
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 12,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 14,
            }}
          >
            Certificates
          </h2>
          <ul
            role="list"
            style={{ listStyle: "none", display: "grid", gap: 10, fontSize: 14, padding: 0, margin: 0 }}
          >
            {certificates.map((c) => (
              <li
                key={c.name}
                className="qv-surface-card"
                style={{
                  padding: "12px 14px",
                  background: "hsl(252, 16%, 13%)",
                  border: "1px solid hsl(250, 15%, 22%)",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span>
                    <strong style={{ color: "hsl(38, 85%, 60%)" }}>{c.name}</strong> — {c.issuer} ({c.year})
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="qv-inline-link"
                      style={{
                        color: "hsl(150, 50%, 58%)",
                        textDecoration: "none",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                      }}
                    >
                      {c.linkLabel}
                    </a>
                    <a
                      href={c.verifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="qv-inline-link"
                      style={{
                        color: "hsl(38, 85%, 62%)",
                        textDecoration: "none",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11.5,
                      }}
                    >
                      Verify on LinkedIn ↗
                    </a>
                  </div>
                </div>
                {c.summary && (
                  <p style={{ fontSize: 13, color: "hsl(250, 10%, 68%)", margin: 0, lineHeight: 1.5 }}>
                    {c.summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section id="qv-contact" aria-labelledby="qv-contact-heading" style={sectionCardStyle}>
          <h2
            id="qv-contact-heading"
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 12,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 14,
            }}
          >
            Contact
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <a
              href={resumeHref}
              download={personalInfo.resumePdf}
              className="qv-interactive-card"
              style={{
                padding: "10px 14px",
                border: "1px solid hsla(150, 50%, 45%, 0.7)",
                background: "hsl(252, 16%, 14%)",
                color: "hsl(150, 55%, 62%)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ⬇ Download Resume (PDF)
            </a>
            <a
              href={personalInfo.github}
              target="_blank"
              rel="noreferrer"
              className="qv-interactive-card"
              style={{
                padding: "10px 14px",
                border: "1px solid hsl(250, 15%, 25%)",
                background: "hsl(252, 16%, 14%)",
                color: "hsl(40, 25%, 90%)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              GitHub ↗
            </a>
            <a
              href={personalInfo.linkedin}
              target="_blank"
              rel="noreferrer"
              className="qv-interactive-card"
              style={{
                padding: "10px 14px",
                border: "1px solid hsl(250, 15%, 25%)",
                background: "hsl(252, 16%, 14%)",
                color: "hsl(40, 25%, 90%)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              LinkedIn ↗
            </a>
            <a
              href={`mailto:${personalInfo.email}`}
              className="qv-interactive-card"
              style={{
                padding: "10px 14px",
                border: "1px solid hsl(38, 85%, 55%)",
                background: "hsl(252, 16%, 14%)",
                color: "hsl(38, 85%, 60%)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Email Me
            </a>
          </div>
        </section>
      </main>

      <footer
        style={{
          maxWidth: 1020,
          margin: "0 auto",
          padding: "0 16px 36px",
          fontSize: 12.5,
          color: "hsl(250, 10%, 58%)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span>© 2026 {personalInfo.name} · Computer Science Portfolio</span>
        <span>Tip: Share direct resume mode via ?view=quick</span>
      </footer>

      <ImageLightbox
        items={allMediaImages}
        activeIndex={lightboxIdx}
        onChangeIndex={setLightboxIdx}
      />
      <style>{`
        @keyframes mediaThumbPulse {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .qv-visually-hidden:where(:not(:focus-within, :active)) {
          position: absolute !important;
          clip-path: inset(50%) !important;
          overflow: hidden !important;
          width: 1px !important;
          height: 1px !important;
          margin: -1px !important;
          padding: 0 !important;
          border: 0 !important;
          white-space: nowrap !important;
        }
        .qv-skip-link {
          position: fixed;
          top: 10px;
          left: 10px;
          z-index: 120;
          padding: 8px 14px;
          background: hsl(38, 85%, 55%);
          color: hsl(255, 20%, 8%);
          font-family: 'Press Start 2P', cursive;
          font-size: 9px;
          text-decoration: none;
          border: 1px solid hsl(38, 90%, 65%);
        }
        .qv-skip-link:not(:focus-visible, :active) {
          position: absolute !important;
          clip-path: inset(50%) !important;
          overflow: hidden !important;
          width: 1px !important;
          height: 1px !important;
          margin: -1px !important;
          padding: 0 !important;
          border: 0 !important;
          white-space: nowrap !important;
        }
        .qv-interactive-card,
        .qv-nav-link,
        .qv-action-btn,
        .qv-primary-btn,
        .qv-tag-btn {
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease;
        }
        .qv-interactive-card:hover,
        .qv-nav-link:hover,
        .qv-action-btn:hover,
        .qv-tag-btn:hover {
          border-color: hsl(38, 85%, 55%) !important;
          background: hsl(252, 18%, 15%) !important;
        }
        .qv-interactive-card:active,
        .qv-nav-link:active,
        .qv-action-btn:active,
        .qv-primary-btn:active,
        .qv-tag-btn:active {
          transform: scale(0.98);
        }
        .qv-media-btn:hover img {
          transform: scale(1.015);
        }
        .qv-focus-section:focus-visible,
        #quick-view-page a:focus-visible,
        #quick-view-page button:focus-visible,
        #quick-view-page input:focus-visible {
          outline: 2px solid hsl(38, 85%, 55%);
          outline-offset: 2px;
        }
        @media (max-width: 1260px) {
          .qv-header-inner {
            padding-left: 112px !important;
          }
        }
        @media (max-width: 480px) {
          .qv-header-inner {
            padding-left: 90px !important;
          }
        }
        @media print {
          #bgm-toggle,
          .qv-no-print {
            display: none !important;
          }
          html, body, #root, #quick-view-page {
            position: static !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #111111 !important;
          }
          .qv-sticky-header {
            position: static !important;
            background: #ffffff !important;
            border-bottom: 1px solid #cccccc !important;
          }
          .qv-header-inner {
            padding-left: 16px !important;
          }
          #quick-view-page section,
          #quick-view-page article,
          #quick-view-page figure,
          #quick-view-page li,
          #quick-view-page a {
            background: #ffffff !important;
            color: #111111 !important;
            border-color: #cccccc !important;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default QuickViewPortfolio;
