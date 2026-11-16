import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BgMusic from "./BgMusic";
import * as soundEngine from "@/lib/sound-engine";

describe("BgMusic", () => {
  const playSpy = vi.fn(() => Promise.resolve());
  const pauseSpy = vi.fn();

  beforeEach(() => {
    playSpy.mockClear();
    pauseSpy.mockClear();
    vi.spyOn(soundEngine, "setAudioMuted").mockImplementation(() => {});

    class MockAudio {
      src = "";
      loop = false;
      volume = 1;
      preload = "auto";
      play = playSpy;
      pause = pauseSpy;
    }

    vi.stubGlobal("Audio", MockAudio);
  });

  it("never starts playback on document clicks or movement keys until #bgm-toggle is clicked", async () => {
    render(<BgMusic />);

    const btn = screen.getByRole("button", { name: /MUSIC/i });
    expect(btn).toHaveTextContent("🔇 MUSIC");

    fireEvent.click(document.body);
    fireEvent.keyDown(window, { key: "w" });
    fireEvent.keyDown(document, { key: "Enter" });

    expect(playSpy).not.toHaveBeenCalled();
    expect(soundEngine.setAudioMuted).toHaveBeenCalledWith(true);

    fireEvent.click(btn);
    expect(playSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(btn).toHaveTextContent("🎵 ON");
      expect(soundEngine.setAudioMuted).toHaveBeenCalledWith(false);
    });
  });
});
