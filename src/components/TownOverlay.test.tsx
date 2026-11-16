import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TownOverlay from "./TownOverlay";
import QuickViewPortfolio from "./QuickViewPortfolio";

describe("TownOverlay and QuickViewPortfolio", () => {
  it("renders subtitle, visited ticks, clickable building guide, and unvisited compass", () => {
    const onSelectBuilding = vi.fn();
    const onToggleQuickView = vi.fn();

    render(
      <TownOverlay
        nearBuilding={null}
        modalOpen={false}
        visitedBuildings={new Set(["tavern"])}
        playerPos={{ x: 0, z: 7 }}
        onSelectBuilding={onSelectBuilding}
        onToggleQuickView={onToggleQuickView}
      />
    );

    expect(screen.getByText(/Shealtiel Masangkay/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/8 visited/)).toBeInTheDocument();

    const towerBtns = screen.getAllByRole("button", { name: /Tower/i });
    fireEvent.click(towerBtns[0]);
    expect(onSelectBuilding).toHaveBeenCalledWith("wizard");

    fireEvent.click(screen.getByRole("button", { name: /Quick View/i }));
    expect(onToggleQuickView).toHaveBeenCalledTimes(1);
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
});
