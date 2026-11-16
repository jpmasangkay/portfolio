import { useMemo, useState } from "react";
import { galleryMagazines, galleryPosters } from "@/data/media-works";
import ImageLightbox, { type LightboxImage } from "@/components/ImageLightbox";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 78%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const GalleryModal = () => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const allImages: LightboxImage[] = useMemo(
    () =>
      [...galleryPosters, ...galleryMagazines].map((item) => ({
        src: item.image,
        alt: item.title,
        title: item.title,
        description: item.description,
      })),
    []
  );

  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.85 }}>
        &ldquo;Masterful illusory works, captured and preserved within enchanted frames. Click any piece to inspect closer...&rdquo;
      </p>

      {/* Posters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {galleryPosters.map((work, i) => (
          <button
            key={work.title}
            type="button"
            onClick={() => setLightboxIdx(i)}
            aria-label={`Inspect ${work.title}`}
            style={{
              background: "hsla(250, 15%, 12%, 0.65)",
              border: "2px solid hsl(250, 15%, 22%)",
              overflow: "hidden",
              padding: 0,
              textAlign: "left",
              cursor: "zoom-in",
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
                  fontSize: 7.5,
                  color: "hsl(40, 25%, 88%)",
                  marginBottom: 4,
                  lineHeight: 1.6,
                }}
              >
                {work.title} 🔍
              </p>
              <p style={{ ...modalText, fontSize: 12, opacity: 0.72, lineHeight: 1.45 }}>
                {work.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Magazines */}
      <p
        style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 7.5,
          color: "hsl(150, 45%, 52%)",
          letterSpacing: "0.15em",
          marginBottom: 12,
          textTransform: "uppercase" as const,
        }}
      >
        📖 Enchanted Manuscripts
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        {galleryMagazines.map((mag, i) => (
          <button
            key={mag.title}
            type="button"
            onClick={() => setLightboxIdx(galleryPosters.length + i)}
            aria-label={`Inspect ${mag.title}`}
            style={{
              background: "hsla(250, 15%, 12%, 0.65)",
              border: "2px solid hsl(250, 15%, 22%)",
              overflow: "hidden",
              padding: 0,
              textAlign: "left",
              cursor: "zoom-in",
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
              <p style={{ ...modalText, fontSize: 12, opacity: 0.72 }}>{mag.title} 🔍</p>
            </div>
          </button>
        ))}
      </div>

      <ImageLightbox
        items={allImages}
        activeIndex={lightboxIdx}
        onChangeIndex={setLightboxIdx}
      />
    </div>
  );
};

export default GalleryModal;
