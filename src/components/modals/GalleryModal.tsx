import { galleryMagazines, galleryPosters } from "@/data/media-works";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 75%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const GalleryModal = () => {
  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.8 }}>
        "Masterful illusory works, captured and preserved within enchanted frames..."
      </p>

      {/* Posters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {galleryPosters.map((work) => (
          <div
            key={work.title}
            style={{
              background: "hsla(250, 15%, 12%, 0.6)",
              border: "2px solid hsl(250, 15%, 22%)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 6, background: "hsla(250, 12%, 10%, 0.5)" }}>
              <img
                src={work.image}
                alt={work.title}
                style={{ width: "100%", height: "auto", display: "block", imageRendering: "auto" }}
                loading="lazy"
              />
            </div>
            <div style={{ padding: "8px 10px" }}>
              <p
                style={{
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 7,
                  color: "hsl(40, 25%, 85%)",
                  marginBottom: 4,
                  lineHeight: 1.6,
                }}
              >
                {work.title}
              </p>
              <p style={{ ...modalText, fontSize: 11, opacity: 0.6 }}>
                {work.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Magazines */}
      <p
        style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 7,
          color: "hsl(150, 40%, 45%)",
          letterSpacing: "0.15em",
          marginBottom: 12,
          textTransform: "uppercase" as const,
        }}
      >
        📖 Enchanted Manuscripts
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        {galleryMagazines.map((mag) => (
          <div
            key={mag.title}
            style={{
              background: "hsla(250, 15%, 12%, 0.6)",
              border: "2px solid hsl(250, 15%, 22%)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 6, background: "hsla(250, 12%, 10%, 0.5)" }}>
              <img
                src={mag.image}
                alt={mag.title}
                style={{ width: "100%", height: "auto", display: "block" }}
                loading="lazy"
              />
            </div>
            <div style={{ padding: "6px 10px" }}>
              <p style={{ ...modalText, fontSize: 11, opacity: 0.5 }}>{mag.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryModal;
