import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExitModal from "./ExitModal";
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

  it("renders repository links in QuestBoardModal", () => {
    render(<QuestBoardModal />);
    const link = screen.getByRole("link", { name: /grimoire/i });
    expect(link).toHaveAttribute("href", "https://github.com/jpmasangkay/grimoire");
  });

  it("renders skill tiers and tools in WizardTowerModal", () => {
    render(<WizardTowerModal />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Blender")).toBeInTheDocument();
  });

  it("renders certificates in NoticeBoardModal", () => {
    render(<NoticeBoardModal />);
    expect(screen.getByText("Gemini Certified")).toBeInTheDocument();
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
});
