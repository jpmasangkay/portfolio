import { useState, useCallback, useEffect } from "react";
import BgMusic from "@/components/BgMusic";
import TownWorld from "@/components/TownWorld";
import TownOverlay from "@/components/TownOverlay";
import ScrollModal from "@/components/ScrollModal";
import QuickViewPortfolio from "@/components/QuickViewPortfolio";
import TavernModal from "@/components/modals/TavernModal";
import QuestBoardModal from "@/components/modals/QuestBoardModal";
import WizardTowerModal from "@/components/modals/WizardTowerModal";
import GalleryModal from "@/components/modals/GalleryModal";
import ForgeModal from "@/components/modals/ForgeModal";
import NoticeBoardModal from "@/components/modals/NoticeBoardModal";
import GateModal from "@/components/modals/GateModal";
import ExitModal from "@/components/modals/ExitModal";
import type { BuildingId } from "@/data/portfolio-data";

const VISITED_STORAGE_KEY = "shealtiel_visited_buildings_v1";

function loadVisitedBuildings(): Set<BuildingId> {
  try {
    const raw = localStorage.getItem(VISITED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed as BuildingId[]);
    }
  } catch {
    // Ignore storage read errors
  }
  return new Set();
}

const modalConfig: Record<BuildingId, { title: string; emoji: string; component: React.FC }> = {
  gate: { title: "Town Gate", emoji: "🏰", component: GateModal },
  tavern: { title: "The Tavern", emoji: "🍺", component: TavernModal },
  questboard: { title: "Quest Board", emoji: "📜", component: QuestBoardModal },
  wizard: { title: "Wizard's Tower", emoji: "🧙", component: WizardTowerModal },
  gallery: { title: "The Gallery", emoji: "🎨", component: GalleryModal },
  forge: { title: "The Forge", emoji: "⚒️", component: ForgeModal },
  noticeboard: { title: "Notice Board", emoji: "🏆", component: NoticeBoardModal },
  exit: { title: "Town Exit", emoji: "🕊️", component: ExitModal },
};

const Index = () => {
  const [activeModal, setActiveModal] = useState<BuildingId | null>(null);
  const [nearBuilding, setNearBuilding] = useState<{ id: BuildingId; name: string; emoji: string } | null>(null);
  const [visitedBuildings, setVisitedBuildings] = useState<Set<BuildingId>>(loadVisitedBuildings);
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number }>({ x: 0, z: 7.0 });
  const [quickView, setQuickView] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify([...visitedBuildings]));
    } catch {
      // Ignore storage write errors
    }
  }, [visitedBuildings]);

  const handleInteract = useCallback((buildingId: BuildingId) => {
    setActiveModal(buildingId);
    setVisitedBuildings((prev) => {
      if (prev.has(buildingId)) return prev;
      const next = new Set(prev);
      next.add(buildingId);
      return next;
    });
  }, []);

  const handleNearBuilding = useCallback(
    (building: { id: BuildingId; name: string; emoji: string } | null) => {
      setNearBuilding(building);
    },
    []
  );

  const handleClose = useCallback(() => {
    setActiveModal(null);
  }, []);

  const currentModal = activeModal ? modalConfig[activeModal] : null;

  return (
    <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#0a0812" }}>
      {/* Background Music */}
      <BgMusic />

      {/* 3D World */}
      <TownWorld
        onInteract={handleInteract}
        onNearBuilding={handleNearBuilding}
        onPlayerPosChange={setPlayerPos}
        modalOpen={activeModal !== null}
        paused={quickView}
      />

      {/* HUD Overlay */}
      {!quickView && (
        <TownOverlay
          nearBuilding={nearBuilding}
          modalOpen={activeModal !== null}
          visitedBuildings={visitedBuildings}
          playerPos={playerPos}
          onSelectBuilding={handleInteract}
          onToggleQuickView={() => setQuickView(true)}
        />
      )}

      {/* Recruiter Quick View */}
      {quickView && <QuickViewPortfolio onBackToWorld={() => setQuickView(false)} />}

      {/* Content Modal */}
      {currentModal && !quickView && (
        <ScrollModal
          open={true}
          onClose={handleClose}
          title={currentModal.title}
          emoji={currentModal.emoji}
        >
          <currentModal.component />
        </ScrollModal>
      )}
    </div>
  );
};

export default Index;
