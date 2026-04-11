import { useState, useCallback } from "react";
import BgMusic from "@/components/BgMusic";
import TownWorld from "@/components/TownWorld";
import TownOverlay from "@/components/TownOverlay";
import ScrollModal from "@/components/ScrollModal";
import TavernModal from "@/components/modals/TavernModal";
import QuestBoardModal from "@/components/modals/QuestBoardModal";
import WizardTowerModal from "@/components/modals/WizardTowerModal";
import GalleryModal from "@/components/modals/GalleryModal";
import ForgeModal from "@/components/modals/ForgeModal";
import NoticeBoardModal from "@/components/modals/NoticeBoardModal";
import GateModal from "@/components/modals/GateModal";
import ExitModal from "@/components/modals/ExitModal";
import type { BuildingId } from "@/data/portfolio-data";

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

  const handleInteract = useCallback((buildingId: BuildingId) => {
    setActiveModal(buildingId);
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
        modalOpen={activeModal !== null}
      />

      {/* HUD Overlay */}
      <TownOverlay
        nearBuilding={nearBuilding}
        modalOpen={activeModal !== null}
      />

      {/* Content Modal */}
      {currentModal && (
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
