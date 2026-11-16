import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import BgMusic from "@/components/BgMusic";
import TownWorld, { type InteriorActionPrompt } from "@/components/TownWorld";
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
import {
  SECRET_FINDS,
  computePlayerProgression,
  type InteriorId,
  type SecretFindDef,
} from "@/lib/realm-progression";
import {
  ZoneAmbienceController,
  isAudioMuted,
  subscribeAudioMuted,
} from "@/lib/sound-engine";

const VISITED_STORAGE_KEY = "shealtiel_visited_buildings_v1";
const VISITED_ZONES_STORAGE_KEY = "shealtiel_visited_zones_v1";
const TALKED_VILLAGERS_KEY = "shealtiel_talked_villagers_v1";
const SECRETS_STORAGE_KEY = "shealtiel_found_secrets_v1";
const GREETED_STORAGE_KEY = "shealtiel_greeted_rowan_v1";
const CLOAK_STORAGE_KEY = "shealtiel_royal_cloak_v1";
const NIGHT_PIN_STORAGE_KEY = "shealtiel_night_pinned_v1";

function loadStringSet<T extends string>(key: string, required?: T[]): Set<T> {
  const result = new Set<T>(required ?? []);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "string") result.add(item as T);
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return result;
}

function saveStringSet(key: string, values: ReadonlySet<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...values]));
  } catch {
    // Ignore storage write errors
  }
}

function loadBooleanFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

const modalConfig: Record<Exclude<BuildingId, "wizard">, { title: string; emoji: string; component: React.FC }> = {
  gate: { title: "Town Gate", emoji: "🏰", component: GateModal },
  tavern: { title: "The Tavern", emoji: "🍺", component: TavernModal },
  questboard: { title: "Quest Board", emoji: "📜", component: QuestBoardModal },
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
  const [nearSecret, setNearSecret] = useState<SecretFindDef | null>(null);
  const [nearInteriorAction, setNearInteriorAction] = useState<InteriorActionPrompt | null>(null);
  const [activeVillager, setActiveVillager] = useState<VillagerDef | null>(null);
  const [villagerLineIndex, setVillagerLineIndex] = useState(0);
  const [currentZone, setCurrentZone] = useState<ZoneId>("town");
  const [currentInterior, setCurrentInterior] = useState<InteriorId | null>(null);
  const [exitInteriorSignal, setExitInteriorSignal] = useState(0);
  const [zoneTransitioning, setZoneTransitioning] = useState(false);
  const [visitedBuildings, setVisitedBuildings] = useState<Set<BuildingId>>(() =>
    loadStringSet<BuildingId>(VISITED_STORAGE_KEY)
  );
  const [visitedZones, setVisitedZones] = useState<Set<ZoneId>>(() =>
    loadStringSet<ZoneId>(VISITED_ZONES_STORAGE_KEY, ["town"])
  );
  const [talkedVillagers, setTalkedVillagers] = useState<Set<string>>(() =>
    loadStringSet<string>(TALKED_VILLAGERS_KEY)
  );
  const [foundSecrets, setFoundSecrets] = useState<Set<string>>(() =>
    loadStringSet<string>(SECRETS_STORAGE_KEY)
  );
  const [greetedByRowan, setGreetedByRowan] = useState<boolean>(() => loadBooleanFlag(GREETED_STORAGE_KEY));
  const [cloakEquipped, setCloakEquipped] = useState<boolean>(() => loadBooleanFlag(CLOAK_STORAGE_KEY));
  const [nightPinned, setNightPinned] = useState<boolean>(() => loadBooleanFlag(NIGHT_PIN_STORAGE_KEY));
  const [timeInfo, setTimeInfo] = useState<{ label: string; emoji: string; raining: boolean }>({
    label: "Midnight",
    emoji: "🌙",
    raining: false,
  });
  const [discoveryToast, setDiscoveryToast] = useState<string | null>(null);
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number }>({ x: 0, z: 8.0 });
  const [quickView, setQuickView] = useState(false);
  const [audioMuted, setAudioMutedState] = useState<boolean>(() => isAudioMuted());
  const zoneTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const ambienceRef = useRef<ZoneAmbienceController | null>(null);

  const showToast = useCallback((msg: string) => {
    setDiscoveryToast(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setDiscoveryToast(null);
    }, 3200);
  }, []);

  useEffect(() => saveStringSet(VISITED_STORAGE_KEY, visitedBuildings), [visitedBuildings]);
  useEffect(() => saveStringSet(VISITED_ZONES_STORAGE_KEY, visitedZones), [visitedZones]);
  useEffect(() => saveStringSet(TALKED_VILLAGERS_KEY, talkedVillagers), [talkedVillagers]);
  useEffect(() => saveStringSet(SECRETS_STORAGE_KEY, foundSecrets), [foundSecrets]);

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
    try {
      localStorage.setItem(NIGHT_PIN_STORAGE_KEY, nightPinned ? "1" : "0");
    } catch {
      // Ignore storage write errors
    }
  }, [nightPinned]);

  useEffect(() => {
    const controller = new ZoneAmbienceController();
    ambienceRef.current = controller;
    const unsub = subscribeAudioMuted((m) => setAudioMutedState(m));
    return () => {
      unsub();
      controller.dispose();
      ambienceRef.current = null;
      if (zoneTimerRef.current !== null) window.clearTimeout(zoneTimerRef.current);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    ambienceRef.current?.setContextState(audioMuted || quickView, currentZone, currentInterior);
  }, [audioMuted, quickView, currentZone, currentInterior]);

  const markBuildingVisited = useCallback((buildingId: BuildingId) => {
    setVisitedBuildings((prev) => {
      if (prev.has(buildingId)) return prev;
      const next = new Set(prev);
      next.add(buildingId);
      if (next.size >= TOWN_BUILDINGS_LAYOUT.length) {
        setCloakEquipped(true);
        showToast("👑 All 8 landmarks explored! Royal Cloak unlocked (+100 XP)");
      }
      return next;
    });
  }, [showToast]);

  const handleInteract = useCallback((buildingId: BuildingId) => {
    setActiveVillager(null);
    setQuestLogOpen(false);
    setActiveModal(buildingId);
    markBuildingVisited(buildingId);
  }, [markBuildingVisited]);

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
    setTalkedVillagers((prev) => {
      if (prev.has(villager.id)) return prev;
      const next = new Set(prev);
      next.add(villager.id);
      return next;
    });
  }, []);

  const handleCollectSecret = useCallback((secret: SecretFindDef) => {
    setFoundSecrets((prev) => {
      if (prev.has(secret.id)) return prev;
      const next = new Set(prev);
      next.add(secret.id);
      showToast(`${secret.emoji} Found ${secret.name}! (${next.size}/${SECRET_FINDS.length}) · +75 XP`);
      return next;
    });
  }, [showToast]);

  const handleInteriorChange = useCallback((interior: InteriorId | null) => {
    setZoneTransitioning(true);
    if (zoneTimerRef.current !== null) window.clearTimeout(zoneTimerRef.current);
    zoneTimerRef.current = window.setTimeout(() => setZoneTransitioning(false), 320);
    setCurrentInterior(interior);
    if (interior) {
      markBuildingVisited(interior);
      showToast(interior === "tavern" ? "🍺 Entered The Tavern" : "🧙 Entered Wizard's Tower Study");
    }
  }, [markBuildingVisited, showToast]);

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

  const progression = useMemo(
    () =>
      computePlayerProgression({
        visitedBuildingsCount: visitedBuildings.size,
        talkedVillagersCount: talkedVillagers.size,
        visitedZones,
        foundSecretsCount: foundSecrets.size,
      }),
    [visitedBuildings.size, talkedVillagers.size, visitedZones, foundSecrets.size]
  );

  const anyModalOpen = activeModal !== null || activeVillager !== null || questLogOpen;
  const currentStdModal =
    activeModal && activeModal !== "wizard" ? modalConfig[activeModal] : null;

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
        onNearSecret={setNearSecret}
        onCollectSecret={handleCollectSecret}
        onZoneChange={handleZoneChange}
        onPlayerPosChange={setPlayerPos}
        onInteriorChange={handleInteriorChange}
        onNearInteriorAction={setNearInteriorAction}
        onTimeInfoChange={setTimeInfo}
        foundSecrets={foundSecrets}
        cloakEquipped={cloakEquipped}
        nightPinned={nightPinned}
        exitInteriorSignal={exitInteriorSignal}
        modalOpen={anyModalOpen}
        paused={quickView}
      />

      {/* HUD Overlay */}
      {!quickView && (
        <TownOverlay
          nearBuilding={nearBuilding}
          nearVillager={nearVillager}
          nearSecret={nearSecret}
          nearInteriorAction={nearInteriorAction}
          currentInterior={currentInterior}
          greetedByRowan={greetedByRowan}
          currentZone={currentZone}
          zoneTransitioning={zoneTransitioning}
          level={progression.level}
          xp={progression.xp}
          progressPct={progression.progressPct}
          secretsFoundCount={foundSecrets.size}
          totalSecretsCount={SECRET_FINDS.length}
          timeInfo={timeInfo}
          nightPinned={nightPinned}
          discoveryToast={discoveryToast}
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
          onToggleNightPin={() => setNightPinned((n) => !n)}
          onExitInterior={() => setExitInteriorSignal((c) => c + 1)}
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
            foundSecrets={foundSecrets}
            level={progression.level}
            xp={progression.xp}
            title={progression.title}
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

      {/* Wizard Tower Character Sheet Modal */}
      {activeModal === "wizard" && !quickView && (
        <ScrollModal
          open={true}
          onClose={handleClose}
          title="Wizard's Tower"
          emoji="🧙"
        >
          <WizardTowerModal
            level={progression.level}
            xp={progression.xp}
            title={progression.title}
            nextLevelXp={progression.nextLevelXp}
            visitedCount={visitedBuildings.size}
            secretsFoundCount={foundSecrets.size}
          />
        </ScrollModal>
      )}

      {/* Standard Building Modals */}
      {currentStdModal && !quickView && (
        <ScrollModal
          open={true}
          onClose={handleClose}
          title={currentStdModal.title}
          emoji={currentStdModal.emoji}
        >
          <currentStdModal.component />
        </ScrollModal>
      )}
    </div>
  );
};

export default Index;
