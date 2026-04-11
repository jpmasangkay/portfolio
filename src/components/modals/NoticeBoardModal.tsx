import { certificates } from "@/data/portfolio-data";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 75%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const NoticeBoardModal = () => {
  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.8 }}>
        "Proof of the trials overcome and knowledge earned along the journey..."
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        {certificates.map((cert) => (
          <div
            key={cert.name}
            style={{
              background: "hsla(250, 15%, 15%, 0.6)",
              border: "2px solid hsl(250, 15%, 22%)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            }}
          >
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
              <p style={{ ...modalText, fontSize: 12, opacity: 0.6 }}>
                {cert.issuer} · {cert.year}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoticeBoardModal;
