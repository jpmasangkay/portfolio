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
            className="nb-cert-card"
            style={{
              background: "hsla(250, 15%, 15%, 0.6)",
              border: "1px solid hsl(250, 15%, 24%)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>🏆</span>
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
                <p style={{ ...modalText, fontSize: 12, opacity: 0.72, marginBottom: cert.summary ? 4 : 0 }}>
                  {cert.issuer} · {cert.year}
                </p>
                {cert.summary && (
                  <p style={{ ...modalText, fontSize: 12, opacity: 0.82, lineHeight: 1.45 }}>
                    {cert.summary}
                  </p>
                )}
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
        className="nb-linkedin-link"
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
      <style>{`
        .nb-cert-card {
          transition: border-color 0.15s ease, transform 0.12s ease, background 0.15s ease;
        }
        .nb-cert-card:hover,
        .nb-cert-card:focus-visible {
          border-color: hsl(38, 85%, 55%) !important;
          background: hsla(250, 15%, 18%, 0.75) !important;
          transform: translate(-1px, -1px);
        }
        .nb-cert-card:active {
          transform: scale(0.985);
        }
        .nb-cert-card:focus-visible,
        .nb-linkedin-link:focus-visible {
          outline: 2px solid hsl(38, 85%, 55%);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default NoticeBoardModal;
