import { useRef, useState, useEffect } from "react";

const BGM_VOLUME = 0.25;

const BgMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const attemptedAutoplay = useRef(false);

  // Create audio once, outside of React rendering
  useEffect(() => {
    const audio = new Audio();
    audio.src = "/bgm.webm";
    audio.loop = true;
    audio.volume = BGM_VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;

    // Try autoplay immediately
    const tryAutoplay = () => {
      if (attemptedAutoplay.current) return;
      attemptedAutoplay.current = true;
      audio.play().then(() => {
        setPlaying(true);
      }).catch(() => {
        // Autoplay blocked — wait for any user interaction
        const startOnInteraction = () => {
          audio.play().then(() => {
            setPlaying(true);
            // Clean up all listeners
            document.removeEventListener("click", startOnInteraction);
            document.removeEventListener("keydown", startOnInteraction);
            document.removeEventListener("touchstart", startOnInteraction);
          }).catch(() => {});
        };
        document.addEventListener("click", startOnInteraction, { once: false });
        document.addEventListener("keydown", startOnInteraction, { once: false });
        document.addEventListener("touchstart", startOnInteraction, { once: false });
      });
    };

    // Small delay to let the page settle
    const timer = setTimeout(tryAutoplay, 500);

    return () => {
      clearTimeout(timer);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => {
        setPlaying(true);
      }).catch(() => {});
    }
  };

  return (
    <button
      id="bgm-toggle"
      onClick={toggleMusic}
      title={playing ? "Mute music" : "Play music"}
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 100,
        fontFamily: "'Press Start 2P', cursive",
        fontSize: "8px",
        color: playing ? "hsl(38, 85%, 55%)" : "hsl(250, 10%, 45%)",
        background: "hsla(255, 20%, 7%, 0.9)",
        border: `2px solid ${playing ? "hsl(38, 85%, 55%)" : "hsla(250, 15%, 25%, 0.6)"}`,
        padding: "8px 14px",
        cursor: "pointer",
        letterSpacing: "0.05em",
        transition: "all 0.2s ease",
        pointerEvents: "auto",
        boxShadow: playing
          ? "0 0 12px hsla(38, 85%, 55%, 0.3)"
          : "0 0 8px rgba(0,0,0,0.5)",
      }}
    >
      {playing ? "🎵 ON" : "🔇 MUSIC"}
    </button>
  );
};

export default BgMusic;
