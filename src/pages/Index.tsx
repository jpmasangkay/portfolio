import { useState, useCallback, useEffect, useRef } from "react";
import BgMusic from "@/components/BgMusic";
import TownWorld from "@/components/TownWorld";
import TownOverlay from "@/components/TownOverlay";
import ScrollModal from "@/components/ScrollModal";
import QuickViewPortfolio from "@/components/QuickViewPortfolio";
import VillagerDialogueBox from "@/components/VillagerDialogueBox";
import TavernModal from "@/components/modals/TavernModal";
import QuestBoardModal from "@/components/modals/QuestBoardModal";
import WizardTowerModal from "@/components/modals/WizardTowerModal";
import GalleryModal from "@/components/modals/GalleryModal";
import ForgeModal from "@/components/modals/ForgeModal";
import NoticeBoardModal from "@/components/modals/NoticeBoardModal";
import GateModal from "@/components/modals/GateModal";
import ExitModal from "@/components/modals/ExitModal";
import QuestLogModal from "@/components/modals/QuestLogModal";
import type { BuildingId } from "@/data/portfolio-data";
import type { VillagerDef } from "@/data/villagers";
import { TOWN_BUILDINGS_LAYOUT } from "@/lib/town-buildings";
import type { ZoneId } from "@/lib/town-zones";

const VISITED_STORAGE_KEY = "shealtiel_visited_buildings_v1";
const VISITED_ZONES_STORAGE_KEY = "shealtiel_visited_zones_v1";
const GREETED_STORAGE_KEY = "shealtiel_greeted_rowan_v1";
const CLOAK_STORAGE_KEY = "shealtiel_royal_cloak_v1";

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

function loadVisitedZones(): Set<ZoneId> {
  try {
    const raw = localStorage.getItem(VISITED_ZONES_STORAGE_KEY);
    if (!raw) return new Set(["town"]);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const set = new Set(parsed as ZoneId[]);
      set.add("town");
      return set;
    }
  } catch {
    // Ignore storage read errors
  }
  return new Set(["town"]);
}

function loadBooleanFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
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
  const [questLogOpen, setQuestLogOpen] = useState(false);
  const [nearBuilding, setNearBuilding] = useState<{ id: BuildingId; name: string; emoji: string } | null>(null);
  const [nearVillager, setNearVillager] = useState<VillagerDef | null>(null);
  const [activeVillager, setActiveVillager] = useState<VillagerDef | null>(null);
  const [villagerLineIndex, setVillagerLineIndex] = useState(0);
  const [currentZone, setCurrentZone] = useState<ZoneId>("town");
  const [zoneTransitioning, setZoneTransitioning] = useState(false);
  const [visitedBuildings, setVisitedBuildings] = useState<Set<BuildingId>>(loadVisitedBuildings);
  const [visitedZones, setVisitedZones] = useState<Set<ZoneId>>(loadVisitedZones);
  const [greetedByRowan, setGreetedByRowan] = useState<boolean>(() => loadBooleanFlag(GREETED_STORAGE_KEY));
  const [cloakEquipped, setCloakEquipped] = useState<boolean>(() => loadBooleanFlag(CLOAK_STORAGE_KEY));
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number }>({ x: 0, z: 8.0 });
  const [quickView, setQuickView] = useState(false);
  const zoneTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify([...visitedBuildings]));
    } catch {
      // Ignore storage write errors
    }
  }, [visitedBuildings]);

  useEffect(() => {
    try {
      localStorage.setItem(VISITED_ZONES_STORAGE_KEY, JSON.stringify([...visitedZones]));
    } catch {
      // Ignore storage write errors
    }
  }, [visitedZones]);

  useEffect(() => {
    try {
      localStorage.setItem(GREETED_STORAGE_KEY, greetedByRowan ? "1" : "0");
    } catch {
      // Ignore storage write errors
    }
  }, [greetedByRowan]);

  useEffect(() => {
    try {
      localStorage.setItem(CLOAK_STORAGE_KEY, cloakEquipped ? "1" : "0");
    } catch {
      // Ignore storage write errors
    }
  }, [cloakEquipped]);

  useEffect(() => {
    return () => {
      if (zoneTimerRef.current !== null) {
        window.clearTimeout(zoneTimerRef.current);
      }
    };
  }, []);

  const handleInteract = useCallback((buildingId: BuildingId) => {
    setActiveVillager(null);
    setQuestLogOpen(false);
    setActiveModal(buildingId);
    setVisitedBuildings((prev) => {
      if (prev.has(buildingId)) return prev;
      const next = new Set(prev);
      next.add(buildingId);
      if (next.size >= TOWN_BUILDINGS_LAYOUT.length) {
        setCloakEquipped(true);
      }
      return next;
    });
  }, []);

  const handleNearBuilding = useCallback(
    (building: { id: BuildingId; name: string; emoji: string } | null) => {
      setNearBuilding(building);
    },
    []
  );

  const handleNearVillager = useCallback((villager: VillagerDef | null) => {
    setNearVillager(villager);
  }, []);

  const handleTalkVillager = useCallback((villager: VillagerDef) => {
    setQuestLogOpen(false);
    setActiveModal(null);
    setActiveVillager(villager);
    setVillagerLineIndex(0);
    if (villager.isGreeter) {
      setGreetedByRowan(true);
    }
  }, []);

  const handleZoneChange = useCallback((nextZone: ZoneId) => {
    setCurrentZone((prev) => {
      if (prev === nextZone) return prev;
      setZoneTransitioning(true);
      if (zoneTimerRef.current !== null) {
        window.clearTimeout(zoneTimerRef.current);
      }
      zoneTimerRef.current = window.setTimeout(() => {
        setZoneTransitioning(false);
      }, 360);
      return nextZone;
    });
    setVisitedZones((prev) => {
      if (prev.has(nextZone)) return prev;
      const next = new Set(prev);
      next.add(nextZone);
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    setActiveModal(null);
  }, []);

  const anyModalOpen = activeModal !== null || activeVillager !== null || questLogOpen;
  const currentModal = activeModal ? modalConfig[activeModal] : null;

  return (
    <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#0a0812" }}>
      {/* Background Music */}
      <BgMusic />

      {/* 3D World */}
      <TownWorld
        onInteract={handleInteract}
        onNearBuilding={handleNearBuilding}
        onTalkVillager={handleTalkVillager}
        onNearVillager={handleNearVillager}
        onZoneChange={handleZoneChange}
        onPlayerPosChange={setPlayerPos}
        cloakEquipped={cloakEquipped}
        modalOpen={anyModalOpen}
        paused={quickView}
      />

      {/* HUD Overlay */}
      {!quickView && (
        <TownOverlay
          nearBuilding={nearBuilding}
          nearVillager={nearVillager}
          greetedByRowan={greetedByRowan}
          currentZone={currentZone}
          zoneTransitioning={zoneTransitioning}
          modalOpen={anyModalOpen}
          visitedBuildings={visitedBuildings}
          playerPos={playerPos}
          onSelectBuilding={handleInteract}
          onToggleQuickView={() => {
            setActiveModal(null);
            setActiveVillager(null);
            setQuestLogOpen(false);
            setQuickView(true);
          }}
          onOpenQuestLog={() => {
            setActiveModal(null);
            setActiveVillager(null);
            setQuestLogOpen(true);
          }}
        />
      )}

      {/* Villager Dialogue Box */}
      {activeVillager && !quickView && (
        <VillagerDialogueBox
          villager={activeVillager}
          lineIndex={villagerLineIndex}
          onNext={() => {
            if (villagerLineIndex + 1 >= activeVillager.lines.length) {
              setActiveVillager(null);
            } else {
              setVillagerLineIndex((i) => i + 1);
            }
          }}
          onClose={() => setActiveVillager(null)}
        />
      )}

      {/* Recruiter Quick View */}
      {quickView && <QuickViewPortfolio onBackToWorld={() => setQuickView(false)} />}

      {/* Quest Log Modal */}
      {questLogOpen && !quickView && (
        <ScrollModal
          open={true}
          onClose={() => setQuestLogOpen(false)}
          title="Adventurer's Quest Log"
          emoji="📒"
        >
          <QuestLogModal
            visitedBuildings={visitedBuildings}
            visitedZones={visitedZones}
            greetedByRowan={greetedByRowan}
            cloakEquipped={cloakEquipped}
            onToggleCloak={() => setCloakEquipped((c) => !c)}
            onJumpToBuilding={handleInteract}
            onOpenQuickView={() => {
              setQuestLogOpen(false);
              setQuickView(true);
            }}
          />
        </ScrollModal>
      )}

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
