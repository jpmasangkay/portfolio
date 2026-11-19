import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExitModal from "./ExitModal";
import ForgeModal from "./ForgeModal";
import GalleryModal from "./GalleryModal";
import NoticeBoardModal from "./NoticeBoardModal";
import QuestBoardModal from "./QuestBoardModal";
import TavernModal from "./TavernModal";
import WizardTowerModal from "./WizardTowerModal";

describe("Portfolio modals", () => {
  it("renders personal bio, experience, and education in TavernModal", () => {
    render(<TavernModal />);
    expect(screen.getByText(/Shealtiel John Paul A\. Masangkay/)).toBeInTheDocument();
    expect(screen.getByText(/Leon Guinto Memorial College/)).toBeInTheDocument();
    expect(screen.getByText(/Sacred Heart College/)).toBeInTheDocument();
  });

  it("renders featured quests and repository links in QuestBoardModal and supports technology filtering", () => {
    render(<QuestBoardModal />);
    expect(screen.getByText("LGMCI Enrollment System")).toBeInTheDocument();
    expect(screen.getByText("Germ Shooter")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /grimoire/i });
    expect(link).toHaveAttribute("href", "https://github.com/jpmasangkay/grimoire");

    // Filter guild commissions by Kotlin
    fireEvent.click(screen.getByRole("button", { name: "Kotlin" }));
    expect(screen.getByRole("link", { name: /app-calculator/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /umbra/i })).not.toBeInTheDocument();
  });

  it("renders skill tiers, character sheet attributes, and tools in WizardTowerModal", () => {
    render(<WizardTowerModal level={4} xp={650} nextLevelXp={900} title="Arcane Scholar" />);
    expect(screen.getByText(/CHARACTER SHEET/i)).toBeInTheDocument();
    expect(screen.getByText(/LV 4/)).toBeInTheDocument();
    expect(screen.getByText(/650\/900 XP/)).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Blender")).toBeInTheDocument();
  });

  it("renders linked certificates in NoticeBoardModal", () => {
    render(<NoticeBoardModal />);
    const geminiLink = screen.getByRole("link", { name: /Gemini Certified/i });
    expect(geminiLink).toHaveAttribute("href", "https://educertifications.google");
    expect(screen.getByText(/Google · 2026/)).toBeInTheDocument();
  });

  it("renders contact links in ExitModal", () => {
    render(<ExitModal />);
    expect(screen.getByRole("link", { name: /GitHub/i })).toHaveAttribute(
      "href",
      "https://github.com/jpmasangkay"
    );
    expect(screen.getByRole("link", { name: /Email/i })).toHaveAttribute(
      "href",
      "mailto:shealtieljohnpaulmasangkay@gmail.com"
    );
  });

  it("renders artwork thumbnails with loading skeleton, loaded state, and error fallback in GalleryModal and ForgeModal", () => {
    const { container } = render(
      <>
        <GalleryModal />
        <ForgeModal />
      </>
    );

    const frames = container.querySelectorAll(".media-thumb-frame");
    expect(frames.length).toBeGreaterThan(0);
    expect(frames[0]).toHaveAttribute("data-status", "loading");

    const firstImg = frames[0].querySelector("img")!;
    fireEvent.load(firstImg);
    expect(frames[0]).toHaveAttribute("data-status", "loaded");

    const secondImg = frames[1].querySelector("img")!;
    fireEvent.error(secondImg);
    expect(frames[1]).toHaveAttribute("data-status", "error");
    expect(screen.getByText(/Preview unavailable/i)).toBeInTheDocument();
  });
});
