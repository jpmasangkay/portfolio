import { useState } from "react";
import { forgeWorks } from "@/data/media-works";
import ImageLightbox from "@/components/ImageLightbox";
import MediaThumbnail from "@/components/MediaThumbnail";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 78%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const ForgeModal = () => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const work = forgeWorks[0];

  return (
    <div>
      <p style={{ ...modalText, fontStyle: "italic", marginBottom: 20, opacity: 0.85 }}>
        &ldquo;In the heart of the town, raw vertices are hammered into magnificent 3D constructs...&rdquo;
      </p>

      <div
        style={{
          background: "hsla(250, 15%, 12%, 0.6)",
          border: "1px solid hsl(250, 15%, 24%)",
          overflow: "hidden",
          boxShadow: "3px 3px 0 rgba(0,0,0,0.3)",
        }}
      >
        <button
          type="button"
          onClick={() => setLightboxIdx(0)}
          aria-label={`Inspect ${work.title} full size`}
          className="forge-preview-btn"
          style={{
            display: "block",
            width: "100%",
            padding: 6,
            background: "hsla(250, 12%, 10%, 0.5)",
            border: "none",
            cursor: "zoom-in",
          }}
        >
          <MediaThumbnail src={work.image} alt={work.alt} aspectHint="16 / 9" />
        </button>
        <div style={{ padding: "14px 16px" }}>
          <p
            style={{
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 9,
              color: "hsl(40, 25%, 88%)",
              marginBottom: 8,
              lineHeight: 1.6,
            }}
          >
            🍺 {work.title} 🔍
          </p>
          <p style={{ ...modalText, marginBottom: 12 }}>{work.description}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
            {work.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  padding: "3px 8px",
                  background: "hsla(250, 15%, 20%, 0.8)",
                  color: "hsl(25, 70%, 60%)",
                  border: "1px solid hsl(250, 15%, 28%)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ImageLightbox
        items={[
          {
            src: work.image,
            alt: work.alt,
            title: work.title,
            description: work.description,
          },
        ]}
        activeIndex={lightboxIdx}
        onChangeIndex={setLightboxIdx}
      />
      <style>{`
        .forge-preview-btn:focus-visible {
          outline: 2px solid hsl(38, 85%, 55%);
          outline-offset: -2px;
        }
      `}</style>
    </div>
  );
};

export default ForgeModal;
