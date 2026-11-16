import { certificates, personalInfo } from "@/data/portfolio-data";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 78%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const NoticeBoardModal = () => {
  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.85 }}>
        &ldquo;Proof of the trials overcome and knowledge earned along the journey...&rdquo;
      </p>

      <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        {certificates.map((cert) => (
          <a
            key={cert.name}
            href={cert.url}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "hsla(250, 15%, 15%, 0.6)",
              border: "2px solid hsl(250, 15%, 22%)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
              textDecoration: "none",
              transition: "border-color 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28 }}>🏆</span>
              <div>
                <p
                  style={{
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: 8,
                    color: "hsl(38, 85%, 55%)",
                    marginBottom: 4,
                    lineHeight: 1.6,
                  }}
                >
                  {cert.name}
                </p>
                <p style={{ ...modalText, fontSize: 12, opacity: 0.72 }}>
                  {cert.issuer} · {cert.year}
                </p>
              </div>
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "hsl(150, 50%, 58%)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {cert.linkLabel}
            </span>
          </a>
        ))}
      </div>

      <a
        href={personalInfo.linkedin}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11.5,
          color: "hsl(38, 85%, 60%)",
          textDecoration: "none",
          borderBottom: "1px solid hsla(38, 85%, 60%, 0.45)",
        }}
      >
        View full Licenses &amp; Certifications on LinkedIn ↗
      </a>
    </div>
  );
};

export default NoticeBoardModal;
