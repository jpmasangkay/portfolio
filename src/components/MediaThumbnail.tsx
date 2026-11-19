import { useState } from "react";

interface MediaThumbnailProps {
  src: string;
  alt: string;
  aspectHint?: string;
}

const MediaThumbnail = ({ src, alt, aspectHint = "16 / 10" }: MediaThumbnailProps) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div
      className="media-thumb-frame"
      data-status={status}
      style={{
        position: "relative",
        width: "100%",
        minHeight: status === "loaded" ? undefined : 140,
        aspectRatio: status === "loaded" ? undefined : aspectHint,
        background: "hsl(252, 20%, 9%)",
        overflow: "hidden",
      }}
    >
      {status === "loading" && (
        <div
          aria-hidden="true"
          className="media-thumb-skeleton"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(110deg, hsl(252, 18%, 11%) 25%, hsl(250, 16%, 16%) 45%, hsl(252, 18%, 11%) 65%)",
            backgroundSize: "200% 100%",
            animation: "mediaThumbPulse 1.4s ease-in-out infinite",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "hsl(250, 10%, 55%)",
          }}
        >
          Loading preview...
        </div>
      )}

      {status === "error" ? (
        <div
          role="img"
          aria-label={alt}
          style={{
            padding: "28px 14px",
            textAlign: "center",
            background: "hsl(252, 18%, 11%)",
            border: "1px dashed hsl(250, 15%, 26%)",
            color: "hsl(250, 12%, 66%)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11.5,
          }}
        >
          Preview unavailable · {alt}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            opacity: status === "loaded" ? 1 : 0.85,
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        />
      )}
    </div>
  );
};

export default MediaThumbnail;
