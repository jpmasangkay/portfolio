import wallowsPoster from "@/assets/photoshop-wallows.png";
import nexonPoster from "@/assets/photoshop-nexon.png";
import magazineFrontBack from "@/assets/magazine-front-back.png";
import magazinePages1to6 from "@/assets/magazine-pages-1-6.png";
import magazinePages2to5 from "@/assets/magazine-pages-2-5.png";
import magazinePages3to4 from "@/assets/magazine-pages-3-4.png";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 75%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const works = [
  {
    title: "Wallows Tour Poster",
    description: "Event-style poster layout with bold typography, high-contrast photo cutout, and textured background.",
    image: wallowsPoster,
  },
  {
    title: "Nexon Product Ad",
    description: "Gaming product advertisement composition using layered imagery, angled panels, and brand-forward callouts.",
    image: nexonPoster,
  },
];

const magazines = [
  { title: "Front & Back Cover", image: magazineFrontBack },
  { title: "Pages 1–6", image: magazinePages1to6 },
  { title: "Pages 2–5", image: magazinePages2to5 },
  { title: "Pages 3–4", image: magazinePages3to4 },
];

const GalleryModal = () => {
  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.8 }}>
        "Masterful illusory works, captured and preserved within enchanted frames..."
      </p>

      {/* Posters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {works.map((work) => (
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
        {magazines.map((mag) => (
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
