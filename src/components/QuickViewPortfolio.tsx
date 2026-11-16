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

interface QuickViewPortfolioProps {
  onBackToWorld: () => void;
}

const sectionCardStyle: React.CSSProperties = {
  background: "hsl(252, 18%, 11%)",
  border: "1px solid hsl(250, 15%, 22%)",
  padding: "20px",
};

const QuickViewPortfolio = ({ onBackToWorld }: QuickViewPortfolioProps) => {
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
      {/* Top sticky bar */}
      <header
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
          <button
            type="button"
            onClick={onBackToWorld}
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

        <nav
          aria-label="Portfolio sections"
          style={{
            maxWidth: 1020,
            margin: "0 auto",
            padding: "0 16px 10px",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
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
              style={{
                color: "hsl(40, 20%, 78%)",
                textDecoration: "none",
                padding: "4px 8px",
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
          padding: "24px 16px 64px",
          display: "grid",
          gap: 20,
        }}
      >
        {/* About + Experience + Education */}
        <section id="qv-about" style={sectionCardStyle}>
          <h1
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 13,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 12,
              lineHeight: 1.7,
            }}
          >
            About &amp; Background
          </h1>
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
            }}
          >
            <div>
              <strong style={{ color: "hsl(150, 45%, 55%)" }}>Location:</strong>{" "}
              {personalInfo.location}
            </div>
            <div>
              <strong style={{ color: "hsl(150, 45%, 55%)" }}>Email:</strong>{" "}
              <a
                href={`mailto:${personalInfo.email}`}
                style={{ color: "hsl(38, 85%, 62%)", wordBreak: "break-all" }}
              >
                {personalInfo.email}
              </a>
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
          <div style={{ display: "grid", gap: 8 }}>
            {education.map((edu) => (
              <div
                key={edu.degree}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 8,
                  paddingBottom: 6,
                  borderBottom: "1px solid hsl(250, 15%, 18%)",
                  fontSize: 14,
                }}
              >
                <div>
                  <strong>{edu.degree}</strong> — {edu.school}
                </div>
                <span style={{ color: "hsl(150, 45%, 55%)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                  {edu.years}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Projects & Repositories */}
        <section id="qv-projects" style={sectionCardStyle}>
          <h2
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
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
              marginBottom: 22,
            }}
          >
            {projects.map((proj) => (
              <article
                key={proj.title}
                style={{
                  background: "hsl(252, 16%, 14%)",
                  border: "1px solid hsl(250, 15%, 24%)",
                  padding: 14,
                }}
              >
                <p style={{ fontWeight: 600, color: "hsl(38, 85%, 60%)", marginBottom: 4 }}>
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
                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "hsl(40, 15%, 78%)" }}>
                  {proj.description}
                </p>
              </article>
            ))}
          </div>

          <h3
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 10,
              color: "hsl(150, 45%, 55%)",
              marginBottom: 12,
            }}
          >
            GitHub Repositories
          </h3>
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
        </section>

        {/* Skills */}
        <section id="qv-skills" style={sectionCardStyle}>
          <h2
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 12,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 14,
            }}
          >
            Technical Skills
          </h2>
          <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
            <div>
              <strong style={{ color: "hsl(38, 85%, 60%)" }}>Proficient:</strong>{" "}
              {skills.intermediate.join(", ")}
            </div>
            <div>
              <strong style={{ color: "hsl(150, 45%, 55%)" }}>Familiar / Studied:</strong>{" "}
              {skills.beginner.join(", ")}
            </div>
            <div>
              <strong style={{ color: "hsl(250, 35%, 75%)" }}>Tools:</strong>{" "}
              {skills.tools.join(", ")}
            </div>
          </div>
        </section>

        {/* Gallery & 3D Work */}
        <section id="qv-gallery" style={sectionCardStyle}>
          <h2
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
            {[...galleryPosters, ...galleryMagazines].map((item) => (
              <figure
                key={item.title}
                style={{
                  background: "hsl(252, 16%, 13%)",
                  border: "1px solid hsl(250, 15%, 22%)",
                  padding: 10,
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  style={{ width: "100%", height: "auto", display: "block", marginBottom: 8 }}
                />
                <figcaption style={{ fontSize: 13 }}>
                  <strong>{item.title}</strong> —{" "}
                  <span style={{ color: "hsl(250, 10%, 66%)" }}>{item.description}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="qv-forge" style={sectionCardStyle}>
          <h2
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 12,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 14,
            }}
          >
            3D Work (Blender)
          </h2>
          {forgeWorks.map((work) => (
            <figure
              key={work.title}
              style={{
                background: "hsl(252, 16%, 13%)",
                border: "1px solid hsl(250, 15%, 22%)",
                padding: 12,
              }}
            >
              <img
                src={work.image}
                alt={work.alt}
                loading="lazy"
                style={{ width: "100%", height: "auto", display: "block", marginBottom: 10 }}
              />
              <figcaption style={{ fontSize: 14, lineHeight: 1.6 }}>
                <strong>{work.title}</strong> — {work.description}
              </figcaption>
            </figure>
          ))}
        </section>

        {/* Certificates */}
        <section id="qv-certs" style={sectionCardStyle}>
          <h2
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 12,
              color: "hsl(38, 85%, 55%)",
              marginBottom: 14,
            }}
          >
            Certificates
          </h2>
          <ul style={{ listStyle: "none", display: "grid", gap: 8, fontSize: 14 }}>
            {certificates.map((c) => (
              <li
                key={c.name}
                style={{
                  padding: "10px 12px",
                  background: "hsl(252, 16%, 13%)",
                  border: "1px solid hsl(250, 15%, 22%)",
                }}
              >
                <strong>{c.name}</strong> — {c.issuer} ({c.year})
              </li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section id="qv-contact" style={sectionCardStyle}>
          <h2
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
              href={personalInfo.github}
              target="_blank"
              rel="noreferrer"
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
      <style>{`
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
      `}</style>
    </div>
  );
};

export default QuickViewPortfolio;
