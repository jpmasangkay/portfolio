import { useRef, useState } from "react";
import { personalInfo } from "@/data/portfolio-data";

const modalText: React.CSSProperties = {
  fontFamily: "'MedievalSharp', serif",
  color: "hsl(40, 25%, 75%)",
  fontSize: 14,
  lineHeight: 1.7,
};

const ExitModal = () => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [copyMsg, setCopyMsg] = useState("");
  const timerRef = useRef<number | null>(null);
  const lastMsgRef = useRef("");
  const resumeHref = `${import.meta.env.BASE_URL}${personalInfo.resumePdf}`;

  const handleCopyEmail = async () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    let ok = false;
    try {
      await navigator.clipboard.writeText(personalInfo.email);
      ok = true;
    } catch {
      ok = false;
    }
    let msg = ok ? "Copied" : "Copy failed";
    if (msg === lastMsgRef.current) msg += "\u00A0";
    lastMsgRef.current = msg;
    setCopyState(ok ? "copied" : "failed");
    setCopyMsg(msg);
    timerRef.current = window.setTimeout(() => {
      setCopyState("idle");
      setCopyMsg("");
    }, 2000);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 36, marginBottom: 12 }}>🕊️</p>
      <p
        style={{
          fontFamily: "'Press Start 2P', cursive",
          fontSize: 10,
          color: "hsl(38, 85%, 55%)",
          marginBottom: 16,
          lineHeight: 2,
        }}
      >
        Leaving so soon?
      </p>
      <p style={{ ...modalText, marginBottom: 24, opacity: 0.8 }}>
        Before you depart, perhaps download the adventurer&apos;s scroll, send a raven, or visit the guild...
      </p>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, alignItems: "center" }}>
        <a
          href={resumeHref}
          download={personalInfo.resumePdf}
          className="exit-action-link"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            background: "hsla(150, 35%, 14%, 0.5)",
            border: "1px solid hsla(150, 45%, 42%, 0.65)",
            color: "hsl(150, 55%, 65%)",
            textDecoration: "none",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 8,
            boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            width: "fit-content",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 18 }}>📜</span>
          Download Resume (PDF)
        </a>

        <a
          href={personalInfo.github}
          target="_blank"
          rel="noreferrer"
          className="exit-action-link"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            background: "hsla(250, 15%, 15%, 0.6)",
            border: "1px solid hsl(250, 15%, 24%)",
            color: "hsl(40, 25%, 85%)",
            textDecoration: "none",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 8,
            boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            width: "fit-content",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 18 }}>🐦</span>
          Scribe&apos;s Guild (GitHub)
        </a>

        <a
          href={personalInfo.linkedin}
          target="_blank"
          rel="noreferrer"
          className="exit-action-link"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            background: "hsla(250, 15%, 15%, 0.6)",
            border: "1px solid hsl(250, 15%, 24%)",
            color: "hsl(40, 25%, 85%)",
            textDecoration: "none",
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 8,
            boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            width: "fit-content",
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 18 }}>📯</span>
          Herald&apos;s Network (LinkedIn)
        </a>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8 }}>
          <a
            href={`mailto:${personalInfo.email}`}
            className="exit-action-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              background: "hsla(250, 15%, 15%, 0.6)",
              border: "1px solid hsl(250, 15%, 24%)",
              color: "hsl(40, 25%, 85%)",
              textDecoration: "none",
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 8,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
              width: "fit-content",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 18 }}>🕊️</span>
            Send a Raven (Email)
          </a>

          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={handleCopyEmail}
              aria-label="Copy email address"
              data-copied={copyState === "copied" ? "" : undefined}
              data-failed={copyState === "failed" ? "" : undefined}
              className="exit-action-link"
              style={{
                padding: "10px 14px",
                minHeight: 38,
                background: "hsla(250, 15%, 15%, 0.6)",
                border:
                  copyState === "copied"
                    ? "1px solid hsl(150, 55%, 50%)"
                    : "1px solid hsl(250, 15%, 24%)",
                color:
                  copyState === "copied" ? "hsl(150, 60%, 65%)" : "hsl(38, 85%, 60%)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {copyState === "copied" ? "✓ Copied" : "⧉ Copy"}
            </button>
            <span
              role="status"
              aria-live="polite"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "hsl(150, 60%, 62%)",
                opacity: copyMsg ? 1 : 0,
                width: copyMsg ? "auto" : 0,
                overflow: "hidden",
              }}
            >
              {copyMsg}
            </span>
          </span>
        </div>
      </div>

      <p style={{ ...modalText, fontSize: 11, opacity: 0.4, marginTop: 24 }}>
        © 2026 Shealtiel John Paul A. Masangkay · All rights reserved
      </p>

      <style>{`
        .exit-action-link {
          transition: border-color 0.15s ease, transform 0.12s ease, background 0.15s ease;
        }
        .exit-action-link:hover,
        .exit-action-link:focus-visible {
          border-color: hsl(38, 85%, 55%) !important;
          background: hsla(250, 15%, 18%, 0.78) !important;
          transform: translate(-1px, -1px);
        }
        .exit-action-link:active {
          transform: scale(0.98);
        }
        .exit-action-link:focus-visible {
          outline: 2px solid hsl(38, 85%, 55%);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default ExitModal;
