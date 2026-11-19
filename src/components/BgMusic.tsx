import { useRef, useState, useEffect } from "react";
import { setAudioMuted } from "@/lib/sound-engine";

const BGM_VOLUME = 0.25;

const BgMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.src = `${import.meta.env.BASE_URL}bgm.webm`;
    audio.loop = true;
    audio.volume = BGM_VOLUME;
    audio.preload = "none";
    audioRef.current = audio;
    // Ensure ambience remains muted until user explicitly opts in via #bgm-toggle
    setAudioMuted(true);

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      setAudioMuted(true);
    };
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      setAudioMuted(true);
    } else {
      audio
        .play()
        .then(() => {
          setPlaying(true);
          setAudioMuted(false);
        })
        .catch(() => {});
    }
  };

  return (
    <button
      id="bgm-toggle"
      type="button"
      aria-pressed={playing}
      onClick={toggleMusic}
      title={playing ? "Mute music" : "Play music"}
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 100,
        fontFamily: "'Press Start 2P', cursive",
        fontSize: "8px",
        color: playing ? "hsl(38, 85%, 55%)" : "hsl(250, 10%, 60%)",
        background: "hsla(255, 20%, 7%, 0.9)",
        border: `1px solid ${playing ? "hsl(38, 85%, 55%)" : "hsla(250, 15%, 28%, 0.8)"}`,
        padding: "8px 14px",
        minHeight: 32,
        cursor: "pointer",
        letterSpacing: "0.05em",
        transition: "border-color 0.15s ease, color 0.15s ease, transform 0.1s ease, box-shadow 0.2s ease",
        pointerEvents: "auto",
        boxShadow: playing
          ? "0 0 12px hsla(38, 85%, 55%, 0.25)"
          : "0 2px 8px rgba(0,0,0,0.45)",
      }}
    >
      {playing ? "🎵 ON" : "🔇 MUSIC"}
    </button>
  );
};

export default BgMusic;
