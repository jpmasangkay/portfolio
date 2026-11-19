import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TownOverlay from "./TownOverlay";
import QuickViewPortfolio from "./QuickViewPortfolio";
import VillagerDialogueBox from "./VillagerDialogueBox";
import QuestLogModal from "./modals/QuestLogModal";
import { VILLAGERS } from "@/data/villagers";
import { TOWN_BUILDINGS_LAYOUT } from "@/lib/town-buildings";

describe("TownOverlay and QuickViewPortfolio", () => {
  it("renders subtitle, visited ticks, clickable building guide, quests button, and unvisited compass", () => {
    const onSelectBuilding = vi.fn();
    const onToggleQuickView = vi.fn();
    const onOpenQuestLog = vi.fn();

    render(
      <TownOverlay
        nearBuilding={null}
        nearVillager={VILLAGERS[0]}
        greetedByRowan={false}
        currentZone="town"
        modalOpen={false}
        visitedBuildings={new Set(["tavern"])}
        playerPos={{ x: 0, z: 7 }}
        onSelectBuilding={onSelectBuilding}
        onToggleQuickView={onToggleQuickView}
        onOpenQuestLog={onOpenQuestLog}
      />
    );

    expect(screen.getByText(/Shealtiel Masangkay/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/8 visited/)).toBeInTheDocument();
    expect(screen.getByText(/Town Square/i)).toBeInTheDocument();
    expect(screen.getByText(/Rowan — Town Greeter/i)).toBeInTheDocument();
    expect(screen.getByText(/⭐ LV 1/)).toBeInTheDocument();
    expect(screen.getByText(/🔮 0\/5/)).toBeInTheDocument();

    const towerBtns = screen.getAllByRole("button", { name: /Tower/i });
    fireEvent.click(towerBtns[0]);
    expect(onSelectBuilding).toHaveBeenCalledWith("wizard");

    fireEvent.click(screen.getByRole("button", { name: /Open Quest Log/i }));
    expect(onOpenQuestLog).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Quick View/i }));
    expect(onToggleQuickView).toHaveBeenCalledTimes(1);
  });

  it("renders VillagerDialogueBox and cycles lines", () => {
    const onNext = vi.fn();
    const onClose = vi.fn();
    render(
      <VillagerDialogueBox
        villager={VILLAGERS[0]}
        lineIndex={0}
        onNext={onNext}
        onClose={onClose}
      />
    );

    expect(screen.getByText(new RegExp(VILLAGERS[0].lines[0].slice(0, 24)))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders QuestLogModal locked and unlocked reward states", () => {
    const onToggleCloak = vi.fn();
    const { rerender } = render(
      <QuestLogModal
        visitedBuildings={new Set(["tavern"])}
        visitedZones={new Set(["town"])}
        greetedByRowan={false}
        cloakEquipped={false}
        onToggleCloak={onToggleCloak}
        onJumpToBuilding={vi.fn()}
        onOpenQuickView={vi.fn()}
      />
    );

    expect(screen.getByText(/Completion Reward \(7 left\)/i)).toBeInTheDocument();

    rerender(
      <QuestLogModal
        visitedBuildings={new Set(TOWN_BUILDINGS_LAYOUT.map((b) => b.id))}
        visitedZones={new Set(["town", "forest", "lakeside", "ruins"])}
        greetedByRowan={true}
        cloakEquipped={false}
        onToggleCloak={onToggleCloak}
        onJumpToBuilding={vi.fn()}
        onOpenQuickView={vi.fn()}
      />
    );

    expect(screen.getByText(/Reward Unlocked: Royal Cloak & Hire Me Scroll/i)).toBeInTheDocument();
    expect(screen.getByText(/Archmage-Rogue Royal Cloak/i)).toBeInTheDocument();
  });

  it("supports night pin toggle and walk-in interior leave button", () => {
    const onToggleNightPin = vi.fn();
    const onToggleLowGraphics = vi.fn();
    const onExitInterior = vi.fn();

    render(
      <TownOverlay
        nearBuilding={null}
        currentInterior="tavern"
        nearInteriorAction={{
          id: "tavern-dossier",
          label: "Adventurer's Dossier",
          emoji: "📖",
          actionType: "modal",
          buildingId: "tavern",
        }}
        level={3}
        xp={425}
        secretsFoundCount={2}
        totalSecretsCount={5}
        nightPinned={true}
        lowGraphics={true}
        modalOpen={false}
        visitedBuildings={new Set(["tavern"])}
        playerPos={{ x: 0, z: 72 }}
        onSelectBuilding={vi.fn()}
        onToggleQuickView={vi.fn()}
        onToggleNightPin={onToggleNightPin}
        onToggleLowGraphics={onToggleLowGraphics}
        onExitInterior={onExitInterior}
      />
    );

    expect(screen.getByText(/⭐ LV 3/)).toBeInTheDocument();
    expect(screen.getByText(/🔮 2\/5/)).toBeInTheDocument();
    expect(screen.getByText(/Inside The Tavern/i)).toBeInTheDocument();
    expect(screen.getByText(/Adventurer's Dossier/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /📌 Night/i }));
    expect(onToggleNightPin).toHaveBeenCalledTimes(1);

    const lowBtn = screen.getByRole("button", { name: /Low graphics/i });
    expect(lowBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(lowBtn);
    expect(onToggleLowGraphics).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Leave Room/i }));
    expect(onExitInterior).toHaveBeenCalledTimes(1);
  });

  it("renders all portfolio sections in QuickViewPortfolio and allows returning", () => {
    const onBack = vi.fn();
    render(<QuickViewPortfolio onBackToWorld={onBack} />);

    expect(screen.getByRole("heading", { name: /About & Background/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Featured Projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "GitHub Repositories" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Technical Skills" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Certificates" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Back to 3D Realm/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("filters repositories by tag and search query, handles empty states, and copies email with live announcement in QuickViewPortfolio", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    const printSpy = vi.fn();
    window.print = printSpy;

    render(<QuickViewPortfolio onBackToWorld={vi.fn()} />);

    // Featured projects include source links and production badge
    expect(screen.getByText(/Production · Institutional System/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /View Source on GitHub/i }).length).toBeGreaterThanOrEqual(3);

    // Filter repositories by Kotlin tag
    fireEvent.click(screen.getByRole("button", { name: "Kotlin" }));
    expect(screen.getByText(/app-calculator/i)).toBeInTheDocument();
    expect(screen.queryByText(/umbra/i)).not.toBeInTheDocument();

    // Search for a non-existent repo to trigger empty state, then reset
    const searchInput = screen.getByLabelText(/Search repositories/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent-xyz" } });
    expect(screen.getByText(/No repositories match the current filter/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Reset Filters/i }));
    expect(screen.getByText(/umbra/i)).toBeInTheDocument();

    // Copy email and verify live region feedback
    fireEvent.click(screen.getByRole("button", { name: /Copy email address/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("shealtieljohnpaulmasangkay@gmail.com");
      expect(screen.getByRole("status")).toHaveTextContent(/Copied/i);
    });

    // Print / Save PDF
    fireEvent.click(screen.getByRole("button", { name: /Print \/ Save PDF/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
