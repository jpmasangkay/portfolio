import { useRef, useState, useEffect } from "react";

const BGM_VOLUME = 0.25;

const BgMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio();
    audio.src = "/bgm.webm";
    audio.loop = true;
    audio.volume = BGM_VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;

    // Auto-start music on any user interaction (required by browsers)
    const startMusic = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      audio.play().then(() => {
        setPlaying(true);
      }).catch(() => {
        // Reset so it tries again on next interaction
        startedRef.current = false;
      });
    };

    // Try autoplay right away (works if user already interacted with the origin)
    audio.play().then(() => {
      startedRef.current = true;
      setPlaying(true);
    }).catch(() => {
      // Autoplay blocked — attach listeners to start on ANY user gesture
      // Use capture phase to fire before anything can stopPropagation
      document.addEventListener("pointerdown", startMusic, { capture: true });
      document.addEventListener("touchstart", startMusic, { capture: true });
      document.addEventListener("click", startMusic, { capture: true });
      document.addEventListener("keydown", startMusic, { capture: true });
    });

    return () => {
      document.removeEventListener("pointerdown", startMusic, { capture: true });
      document.removeEventListener("touchstart", startMusic, { capture: true });
      document.removeEventListener("click", startMusic, { capture: true });
      document.removeEventListener("keydown", startMusic, { capture: true });
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
