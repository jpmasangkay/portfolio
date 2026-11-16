import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import type { BuildingId } from "@/data/portfolio-data";
import { mobileInput, consumeMobileInteract, setMobileDir } from "@/lib/mobile-input";
import {
  CAMERA_SMOOTH_RATE,
  WALK_CYCLE_RAD_PER_SEC,
  clampDeltaSec,
  computeOrthoFrustum,
  expDampingAlpha,
  resolvePlayerStep,
  type ColliderBox,
  type WorldBounds,
} from "@/lib/town-physics";
import {
  TOWN_BUILDINGS_LAYOUT,
  type TownBuildingLayout,
} from "@/lib/town-buildings";
import {
  EXPANDED_WORLD_BOUNDS,
  ZONE_METADATA,
  detectPlayerZone,
  getGroundElevation,
  type ZoneId,
} from "@/lib/town-zones";
import { VILLAGERS, type VillagerDef } from "@/data/villagers";
import {
  SECRET_FINDS,
  WALKIN_BUILDINGS,
  type InteriorId,
  type SecretFindDef,
} from "@/lib/realm-progression";
import { computeDayNightState, type DayNightState } from "@/lib/day-night";

export interface InteriorActionPrompt {
  id: string;
  label: string;
  emoji: string;
  actionType: "modal" | "exit";
  buildingId?: BuildingId;
}

interface TownWorldProps {
  onInteract: (buildingId: BuildingId) => void;
  onNearBuilding: (building: { id: BuildingId; name: string; emoji: string } | null) => void;
  onTalkVillager?: (villager: VillagerDef) => void;
  onNearVillager?: (villager: VillagerDef | null) => void;
  onNearSecret?: (secret: SecretFindDef | null) => void;
  onCollectSecret?: (secret: SecretFindDef) => void;
  onZoneChange?: (zone: ZoneId) => void;
  onPlayerPosChange?: (pos: { x: number; z: number }) => void;
  onInteriorChange?: (interior: InteriorId | null) => void;
  onNearInteriorAction?: (action: InteriorActionPrompt | null) => void;
  onTimeInfoChange?: (info: { label: DayNightState["label"]; emoji: string; raining: boolean }) => void;
  foundSecrets?: ReadonlySet<string>;
  cloakEquipped?: boolean;
  nightPinned?: boolean;
  exitInteriorSignal?: number;
  modalOpen: boolean;
  paused?: boolean;
}

type BuildingDef = TownBuildingLayout;
const BUILDINGS: BuildingDef[] = TOWN_BUILDINGS_LAYOUT;

const INTERACT_DISTANCE = 4.5;
const VILLAGER_INTERACT_DISTANCE = 2.6;
const SECRET_INTERACT_DISTANCE = 2.4;
const PIXEL_SCALE = 3; // render at 1/3 resolution for pixel art
const DAY_CYCLE_DURATION_SEC = 180;

const TAVERN_INTERIOR_BOUNDS: WorldBounds = {
  minX: -4.2,
  maxX: 4.2,
  minZ: 68.8,
  maxZ: 75.8,
};
const WIZARD_INTERIOR_BOUNDS: WorldBounds = {
  minX: 27.8,
  maxX: 36.2,
  minZ: 68.8,
  maxZ: 75.8,
};

const TownWorld = ({
  onInteract,
  onNearBuilding,
  onTalkVillager,
  onNearVillager,
  onNearSecret,
  onCollectSecret,
  onZoneChange,
  onPlayerPosChange,
  onInteriorChange,
  onNearInteriorAction,
  onTimeInfoChange,
  foundSecrets,
  cloakEquipped = false,
  nightPinned = true,
  exitInteriorSignal = 0,
  modalOpen,
  paused = false,
}: TownWorldProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 8.0));
  const nearBuildingRef = useRef<BuildingDef | null>(null);
  const nearVillagerRef = useRef<VillagerDef | null>(null);
  const nearSecretRef = useRef<SecretFindDef | null>(null);
  const nearInteriorActionRef = useRef<InteriorActionPrompt | null>(null);
  const currentZoneRef = useRef<ZoneId>("town");
  const currentInteriorRef = useRef<InteriorId | null>(null);
  const savedOutdoorPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 8.0 });
  const exitRequestFnRef = useRef<(() => void) | null>(null);
  const enterInteriorFnRef = useRef<((id: InteriorId) => void) | null>(null);
  const animFrameRef = useRef<number>(0);
  const modalOpenRef = useRef(modalOpen || paused);
  const pausedRef = useRef(paused);
  const cloakEquippedRef = useRef(cloakEquipped);
  const nightPinnedRef = useRef(nightPinned);
  const foundSecretsRef = useRef<ReadonlySet<string>>(foundSecrets ?? new Set());
  const onPlayerPosChangeRef = useRef(onPlayerPosChange);
  const onTalkVillagerRef = useRef(onTalkVillager);
  const onNearVillagerRef = useRef(onNearVillager);
  const onNearSecretRef = useRef(onNearSecret);
  const onCollectSecretRef = useRef(onCollectSecret);
  const onZoneChangeRef = useRef(onZoneChange);
  const onInteriorChangeRef = useRef(onInteriorChange);
  const onNearInteriorActionRef = useRef(onNearInteriorAction);
  const onTimeInfoChangeRef = useRef(onTimeInfoChange);

  useEffect(() => {
    onPlayerPosChangeRef.current = onPlayerPosChange;
    onTalkVillagerRef.current = onTalkVillager;
    onNearVillagerRef.current = onNearVillager;
    onNearSecretRef.current = onNearSecret;
    onCollectSecretRef.current = onCollectSecret;
    onZoneChangeRef.current = onZoneChange;
    onInteriorChangeRef.current = onInteriorChange;
    onNearInteriorActionRef.current = onNearInteriorAction;
    onTimeInfoChangeRef.current = onTimeInfoChange;
  }, [
    onPlayerPosChange,
    onTalkVillager,
    onNearVillager,
    onNearSecret,
    onCollectSecret,
    onZoneChange,
    onInteriorChange,
    onNearInteriorAction,
    onTimeInfoChange,
  ]);

  useEffect(() => {
    cloakEquippedRef.current = cloakEquipped;
  }, [cloakEquipped]);

  useEffect(() => {
    nightPinnedRef.current = nightPinned;
  }, [nightPinned]);

  useEffect(() => {
    if (foundSecrets) {
      foundSecretsRef.current = foundSecrets;
    }
  }, [foundSecrets]);

  useEffect(() => {
    if (exitInteriorSignal > 0 && currentInteriorRef.current !== null) {
      exitRequestFnRef.current?.();
    }
  }, [exitInteriorSignal]);

  // Keep modalOpen / paused ref in sync and release held inputs when paused or modal opens
  useEffect(() => {
    modalOpenRef.current = modalOpen || paused;
    pausedRef.current = paused;
    if (modalOpen || paused) {
      keysRef.current.clear();
      setMobileDir(0, 0);
    }
  }, [modalOpen, paused]);

  const handleInteract = useCallback(() => {
    if (modalOpenRef.current) return;
    if (currentInteriorRef.current !== null) {
      const action = nearInteriorActionRef.current;
      if (action?.actionType === "exit") {
        exitRequestFnRef.current?.();
        return;
      }
      if (action?.actionType === "modal" && action.buildingId) {
        onInteract(action.buildingId);
        return;
      }
      // Fallback: interacting anywhere inside room inspects the room's showcase modal
      onInteract(currentInteriorRef.current);
      return;
    }
    const nearSecret = nearSecretRef.current;
    if (nearSecret && !foundSecretsRef.current.has(nearSecret.id)) {
      onCollectSecretRef.current?.(nearSecret);
      nearSecretRef.current = null;
      onNearSecretRef.current?.(null);
      return;
    }
    const nearNpc = nearVillagerRef.current;
    const nearBld = nearBuildingRef.current;
    if (nearNpc) {
      onTalkVillagerRef.current?.(nearNpc);
      return;
    }
    if (nearBld) {
      if (WALKIN_BUILDINGS.has(nearBld.id) && enterInteriorFnRef.current) {
        enterInteriorFnRef.current(nearBld.id as InteriorId);
        return;
      }
      onInteract(nearBld.id);
    }
  }, [onInteract]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // ====== RENDERER (low res for pixel art) ======
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    const pixelW = Math.floor(window.innerWidth / PIXEL_SCALE);
    const pixelH = Math.floor(window.innerHeight / PIXEL_SCALE);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // hard pixel shadows
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.style.imageRendering = "pixelated";
    container.appendChild(renderer.domElement);

    // Render target for pixel art look
    const renderTarget = new THREE.WebGLRenderTarget(pixelW, pixelH, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    });

    // Screen quad to display pixelated render
    const screenScene = new THREE.Scene();
    const screenCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const screenMat = new THREE.MeshBasicMaterial({ map: renderTarget.texture });
    const screenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), screenMat);
    screenScene.add(screenQuad);

    // ====== SCENE ======
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x161932);
    scene.fog = new THREE.Fog(0x161932, 34, 68);

    // ====== CAMERA (isometric with portrait scaling & opening sweep) ======
    const frustum = computeOrthoFrustum(window.innerWidth, window.innerHeight, 12);
    const camera = new THREE.OrthographicCamera(
      frustum.left, frustum.right,
      frustum.top, frustum.bottom,
      0.1, 100
    );
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const SWEEP_DURATION = 1.9;
    let sweepElapsed = prefersReducedMotion ? SWEEP_DURATION : 0;
    let sweepDone = Boolean(prefersReducedMotion);
    const sweepStartTarget = new THREE.Vector3(0, 0, -4);
    const sweepStartOffset = new THREE.Vector3(18, 22, 15);
    const followOffset = new THREE.Vector3(15, 18, 15);
    const camLookTarget = new THREE.Vector3(
      sweepDone ? playerPosRef.current.x : sweepStartTarget.x,
      0,
      sweepDone ? playerPosRef.current.z : sweepStartTarget.z
    );
    camera.position.set(
      camLookTarget.x + (sweepDone ? followOffset.x : sweepStartOffset.x),
      sweepDone ? followOffset.y : sweepStartOffset.y,
      camLookTarget.z + (sweepDone ? followOffset.z : sweepStartOffset.z)
    );
    camera.lookAt(camLookTarget);

    // ====== MATERIALS ======
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3b5033 });
    const pathMat = new THREE.MeshLambertMaterial({ color: 0x8a7a68 });
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x3366cc, transparent: true, opacity: 0.7 });

    // ====== GROUND (multi-layered + outer horizon meadow + outskirt zones) ======
    const outerMeadow = new THREE.Mesh(
      new THREE.BoxGeometry(200, 0.4, 200),
      new THREE.MeshLambertMaterial({ color: 0x22301e })
    );
    outerMeadow.position.y = -0.58;
    outerMeadow.receiveShadow = true;
    scene.add(outerMeadow);

    // Base dark earth terrace
    const groundBase = new THREE.Mesh(
      new THREE.BoxGeometry(54, 0.3, 54),
      new THREE.MeshLambertMaterial({ color: 0x2a3c23 })
    );
    groundBase.position.y = -0.35;
    groundBase.receiveShadow = true;
    scene.add(groundBase);
    // Main grass layer
    const ground = new THREE.Mesh(new THREE.BoxGeometry(50, 0.5, 50), groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);

    // Zone 1 Ground: Whispering Forest (West)
    const forestFloor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.4, 34),
      new THREE.MeshLambertMaterial({ color: 0x263f2a })
    );
    forestFloor.position.set(-28, -0.22, 1);
    forestFloor.receiveShadow = true;
    scene.add(forestFloor);

    // Zone 2 Ground: Moonlit Lakeside Shore (East)
    const shoreFloor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.4, 34),
      new THREE.MeshLambertMaterial({ color: 0x334d34 })
    );
    shoreFloor.position.set(28, -0.22, 0);
    shoreFloor.receiveShadow = true;
    scene.add(shoreFloor);

    // Zone 3 Ground: Ruined Hilltop Stepped Ramp + Plateau (North)
    const hillMat = new THREE.MeshLambertMaterial({ color: 0x454952 });
    for (let stepIdx = 0; stepIdx < 4; stepIdx++) {
      const stepY = (stepIdx + 1) * 0.15;
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 0.16, 1.05), hillMat);
      stepMesh.position.set(0, stepY - 0.08, -19 - stepIdx);
      stepMesh.receiveShadow = true;
      scene.add(stepMesh);
    }
    const hilltopPlateau = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.8, 14),
      new THREE.MeshLambertMaterial({ color: 0x344234 })
    );
    hilltopPlateau.position.set(0, 0.2, -29.5);
    hilltopPlateau.receiveShadow = true;
    scene.add(hilltopPlateau);
    // Lighter grass patches (varied terrain)
    const lightGrassMat = new THREE.MeshLambertMaterial({ color: 0x4c653f });
    const darkGrassMat = new THREE.MeshLambertMaterial({ color: 0x2f4126 });
    for (let i = 0; i < 25; i++) {
      const gx = (Math.random() - 0.5) * 40;
      const gz = (Math.random() - 0.5) * 40;
      // Skip if on path
      if (Math.abs(gx) < 2.5 && gz > -14 && gz < 18) continue;
      if (Math.abs(gz) < 2.5 && gx > -14 && gx < 14) continue;
      const size = 1.5 + Math.random() * 3;
      const patch = new THREE.Mesh(
        new THREE.BoxGeometry(size, 0.02, size * (0.7 + Math.random() * 0.6)),
        i % 3 === 0 ? darkGrassMat : lightGrassMat
      );
      patch.position.set(gx, 0.01, gz);
      patch.rotation.y = Math.random() * Math.PI;
      scene.add(patch);
    }
    // Dirt patches around buildings
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0x5a4a35 });
    const addDirtPatch = (x: number, z: number, s: number = 1) => {
      const dirt = new THREE.Mesh(new THREE.BoxGeometry(2 * s, 0.02, 1.5 * s), dirtMat);
      dirt.position.set(x, 0.01, z);
      dirt.rotation.y = Math.random() * Math.PI;
      scene.add(dirt);
    };
    addDirtPatch(-8, 11, 1.5); // tavern front
    addDirtPatch(-9, -4, 1.2); // forge front
    addDirtPatch(10, 1, 1);    // gallery front
    addDirtPatch(0, 16, 2);    // gate area
    addDirtPatch(3, -10, 1);   // wizard area
    addDirtPatch(9, 9, 0.8);   // notice board

    // ====== PATHS (individually placed cobblestones) ======
    const cobbleMats = [
      new THREE.MeshLambertMaterial({ color: 0x8a7a68 }),
      new THREE.MeshLambertMaterial({ color: 0x7a6a58 }),
      new THREE.MeshLambertMaterial({ color: 0x9a8a78 }),
      new THREE.MeshLambertMaterial({ color: 0x6a5a48 }),
    ];
    const addCobblePath = (x: number, z: number, w: number, d: number) => {
      // Base path surface
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.08, d),
        new THREE.MeshLambertMaterial({ color: 0x6a5a48 })
      );
      base.position.set(x, 0.04, z);
      base.receiveShadow = true;
      scene.add(base);
      // Individual cobblestones
      const stoneSize = 0.35;
      const cols = Math.floor(w / stoneSize);
      const rows = Math.floor(d / stoneSize);
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          // Skip some for natural look
          const sx = x - w / 2 + col * stoneSize + stoneSize / 2 + (Math.random() - 0.5) * 0.05;
          const sz = z - d / 2 + row * stoneSize + stoneSize / 2 + (Math.random() - 0.5) * 0.05;
          const sSize = stoneSize * (0.7 + Math.random() * 0.25);
          const stone = new THREE.Mesh(
            new THREE.BoxGeometry(sSize, 0.04 + Math.random() * 0.02, sSize),
            cobbleMats[Math.floor(Math.random() * cobbleMats.length)]
          );
          stone.position.set(sx, 0.08 + Math.random() * 0.01, sz);
          stone.rotation.y = Math.random() * 0.5;
          scene.add(stone);
        }
      }
      // Path border stones
      const borderMat = new THREE.MeshLambertMaterial({ color: 0x5a5045 });
      for (let side = -1; side <= 1; side += 2) {
        if (w > d) {
          // Horizontal path - borders on top/bottom
          for (let bx = 0; bx < Math.floor(w / 0.6); bx++) {
            const border = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.15), borderMat);
            border.position.set(x - w / 2 + bx * 0.6 + 0.3, 0.08, z + side * (d / 2 + 0.05));
            scene.add(border);
          }
        } else {
          // Vertical path - borders on left/right
          for (let bz = 0; bz < Math.floor(d / 0.6); bz++) {
            const border = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.5), borderMat);
            border.position.set(x + side * (w / 2 + 0.05), 0.08, z - d / 2 + bz * 0.6 + 0.3);
            scene.add(border);
          }
        }
      }
    };
    // Main north-south road
    addCobblePath(0, 3, 3, 30);
    // Approaching road beyond south gate & north wall so roads fade into the surrounding realm
    const outerRoadMat = new THREE.MeshLambertMaterial({ color: 0x625648 });
    const southRoadExt = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 22), outerRoadMat);
    southRoadExt.position.set(0, -0.36, 29);
    southRoadExt.receiveShadow = true;
    scene.add(southRoadExt);
    const northRoadExt = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 20), outerRoadMat);
    northRoadExt.position.set(0, -0.36, -26);
    northRoadExt.receiveShadow = true;
    scene.add(northRoadExt);
    // East-west crossroad
    addCobblePath(0, 0, 25, 3);
    // Branch to tavern
    addCobblePath(-4.75, 8, 6.5, 3);
    // Branch to noticeboard
    addCobblePath(4.75, 8, 6.5, 3);

    // ====== POND (detailed) ======
    // Pond bed (darker earth)
    const pondBed = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.5, 0.1, 12),
      new THREE.MeshLambertMaterial({ color: 0x2a3a20 })
    );
    pondBed.position.set(5, 0.02, -5);
    scene.add(pondBed);
    // Main water
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.2, 12), waterMat);
    pond.position.set(5, 0.12, -5);
    scene.add(pond);
    // Pond rim stones
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    for (let ri = 0; ri < 16; ri++) {
      const angle = (ri / 16) * Math.PI * 2;
      const rimStone = new THREE.Mesh(
        new THREE.BoxGeometry(0.4 + Math.random() * 0.15, 0.15, 0.25),
        rimMat
      );
      rimStone.position.set(
        5 + Math.cos(angle) * 2.1,
        0.08,
        -5 + Math.sin(angle) * 2.1
      );
      rimStone.rotation.y = angle + Math.PI / 2;
      scene.add(rimStone);
    }
    // Lily pads
    const lilyMat = new THREE.MeshLambertMaterial({ color: 0x3a6a28 });
    for (let li = 0; li < 5; li++) {
      const la = Math.random() * Math.PI * 2;
      const lr = Math.random() * 1.3;
      const lily = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.02, 6),
        lilyMat
      );
      lily.position.set(5 + Math.cos(la) * lr, 0.22, -5 + Math.sin(la) * lr);
      scene.add(lily);
      // Tiny flower on some
      if (Math.random() > 0.5) {
        const lilyFlower = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.06, 0.08),
          new THREE.MeshLambertMaterial({ color: [0xff88aa, 0xffffff, 0xffcc66][Math.floor(Math.random() * 3)] })
        );
        lilyFlower.position.set(5 + Math.cos(la) * lr, 0.25, -5 + Math.sin(la) * lr);
        scene.add(lilyFlower);
      }
    }
    // Cattails / reeds at pond edge
    const reedMat = new THREE.MeshLambertMaterial({ color: 0x4a6a30 });
    const reedTopMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    for (let ri = 0; ri < 6; ri++) {
      const ra = Math.PI * 0.3 + ri * 0.4;
      const rx = 5 + Math.cos(ra) * 2.2;
      const rz = -5 + Math.sin(ra) * 2.2;
      // Stem
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8 + Math.random() * 0.4, 0.04), reedMat);
      stem.position.set(rx, 0.5, rz);
      scene.add(stem);
      // Top bulb
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.06), reedTopMat);
      bulb.position.set(rx, 0.9 + Math.random() * 0.2, rz);
      scene.add(bulb);
    }

    // ====== WILDFLOWER CLUSTERS ======
    const flowerColors = [0xff5577, 0xffaa44, 0xff66aa, 0xaa66ff, 0xffff66, 0x66aaff, 0xff8844];
    for (let fc = 0; fc < 20; fc++) {
      const fx = (Math.random() - 0.5) * 38;
      const fz = (Math.random() - 0.5) * 38;
      if (Math.abs(fx) < 3 && fz > -14 && fz < 18) continue;
      if (Math.abs(fz) < 3 && fx > -14 && fx < 14) continue;
      const clusterColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      for (let fi = 0; fi < 3 + Math.floor(Math.random() * 4); fi++) {
        const ffx = fx + (Math.random() - 0.5) * 0.8;
        const ffz = fz + (Math.random() - 0.5) * 0.8;
        // Stem
        const fstem = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.15 + Math.random() * 0.1, 0.03),
          new THREE.MeshLambertMaterial({ color: 0x4a7a38 })
        );
        fstem.position.set(ffx, 0.1, ffz);
        scene.add(fstem);
        // Flower head
        const fhead = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.07, 0.07),
          new THREE.MeshLambertMaterial({ color: clusterColor })
        );
        fhead.position.set(ffx, 0.2 + Math.random() * 0.05, ffz);
        scene.add(fhead);
      }
    }

    // ====== GARDEN PLOTS (vegetable rows near tavern) ======
    const gardenSoilMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    const gardenGreenMats = [
      new THREE.MeshLambertMaterial({ color: 0x4a8a30 }),
      new THREE.MeshLambertMaterial({ color: 0x3a7a28 }),
      new THREE.MeshLambertMaterial({ color: 0x5a9a3a }),
    ];
    // Garden bed
    const gardenBed = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 2), gardenSoilMat);
    gardenBed.position.set(-13, 0.04, 5);
    scene.add(gardenBed);
    // Garden border
    const gardenBorderMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    for (let gb = 0; gb < 4; gb++) {
      const isH = gb < 2;
      const gBorder = new THREE.Mesh(
        new THREE.BoxGeometry(isH ? 3.2 : 0.1, 0.15, isH ? 0.1 : 2.2),
        gardenBorderMat
      );
      gBorder.position.set(
        -13 + (isH ? 0 : (gb === 2 ? -1.55 : 1.55)),
        0.08,
        5 + (isH ? (gb === 0 ? -1.05 : 1.05) : 0)
      );
      scene.add(gBorder);
    }
    // Vegetable rows
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const veg = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.08 + Math.random() * 0.08, 0.12),
          gardenGreenMats[Math.floor(Math.random() * gardenGreenMats.length)]
        );
        veg.position.set(-14.2 + col * 0.45, 0.12, 4.2 + row * 0.5);
        scene.add(veg);
      }
    }

    // ====== FENCE LINES ======
    const fenceMat = new THREE.MeshLambertMaterial({ color: 0x5a4030 });
    const addFence = (x1: number, z1: number, x2: number, z2: number, count: number) => {
      const dx = (x2 - x1) / count;
      const dz = (z2 - z1) / count;
      for (let i = 0; i <= count; i++) {
        // Post
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), fenceMat);
        post.position.set(x1 + dx * i, 0.3, z1 + dz * i);
        scene.add(post);
      }
      // Rails
      const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const angle = Math.atan2(x2 - x1, z2 - z1);
      for (let r = 0; r < 2; r++) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, len), fenceMat);
        rail.position.set((x1 + x2) / 2, 0.2 + r * 0.2, (z1 + z2) / 2);
        rail.rotation.y = angle;
        scene.add(rail);
      }
    };
    // Fence around garden
    addFence(-14.6, 3.8, -14.6, 6.2, 4);
    addFence(-11.4, 3.8, -11.4, 6.2, 4);
    addFence(-14.6, 3.8, -11.4, 3.8, 5);
    // Fence near exit
    addFence(10, -13, 15, -13, 6);
    // Fence near pond
    addFence(7.5, -3, 7.5, -7, 5);

    // ====== BUILD BUILDINGS ======
    const colliders: ColliderBox[] = [];
    const addCollider = (minX: number, maxX: number, minZ: number, maxZ: number, label?: string) => {
      colliders.push({ minX, maxX, minZ, maxZ, label });
    };
    const beacons: { mesh: THREE.Mesh; glow: THREE.Mesh; baseY: number }[] = [];

    BUILDINGS.forEach((b) => {
      const group = new THREE.Group();
      const wallMat = new THREE.MeshLambertMaterial({ color: b.wallColor });
      const roofMaterial = new THREE.MeshLambertMaterial({ color: b.roofColor });
      const isOpenGate = b.id === "gate";

      // Main body (Town Gate uses two side piers + overhead bridge to leave a walkable archway)
      if (isOpenGate) {
        const pierW = 1.35;
        const pierOffsetX = b.w / 2 - pierW / 2;
        for (const side of [-1, 1]) {
          const pier = new THREE.Mesh(new THREE.BoxGeometry(pierW, b.h, b.d), wallMat);
          pier.position.set(side * pierOffsetX, b.h / 2, 0);
          pier.castShadow = true;
          pier.receiveShadow = true;
          group.add(pier);
        }
        const upperWall = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h * 0.44, b.d), wallMat);
        upperWall.position.set(0, b.h * 0.78, 0);
        upperWall.castShadow = true;
        upperWall.receiveShadow = true;
        group.add(upperWall);
      } else {
        const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), wallMat);
        body.position.y = b.h / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
      }

      // Roof (pyramid)
      const roofGeo = new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.78, b.roofH, 4);
      const roof = new THREE.Mesh(roofGeo, roofMaterial);
      roof.position.y = b.h + b.roofH / 2;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);

      // Windows (emissive yellow blocks)
      if (b.hasWindows) {
        const winMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
        const winSize = 0.6;
        const winGeo = new THREE.BoxGeometry(winSize, winSize, 0.1);

        // Front windows
        for (let wx = -1; wx <= 1; wx += 2) {
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(wx * (b.w * 0.25), b.h * 0.55, b.d / 2 + 0.06);
          group.add(win);
        }
        // Side windows
        const sideWinGeo = new THREE.BoxGeometry(0.1, winSize, winSize);
        const winR = new THREE.Mesh(sideWinGeo, winMat);
        winR.position.set(b.w / 2 + 0.06, b.h * 0.55, 0);
        group.add(winR);
        const winL = new THREE.Mesh(sideWinGeo, winMat);
        winL.position.set(-b.w / 2 - 0.06, b.h * 0.55, 0);
        group.add(winL);
      }

      // Door (dark rectangle on front) — omitted for open gate archway
      if (!isOpenGate) {
        const doorMat = new THREE.MeshLambertMaterial({ color: 0x2a1a10 });
        const doorGeo = new THREE.BoxGeometry(b.w * 0.25, b.h * 0.45, 0.15);
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, b.h * 0.22, b.d / 2 + 0.08);
        group.add(door);
      }

      // Chimney for tavern and forge
      if (b.id === "tavern" || b.id === "forge") {
        const chimneyMat = new THREE.MeshLambertMaterial({ color: 0x3a3030 });
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2, 0.6), chimneyMat);
        chimney.position.set(b.w * 0.3, b.h + b.roofH * 0.6, -b.d * 0.2);
        chimney.castShadow = true;
        group.add(chimney);
      }

      // ---- TIMBER FRAMING (half-timbered style) ----
      const timberMat = new THREE.MeshLambertMaterial({ color: 0x3a2a18 });
      if (b.hasWindows || isOpenGate) {
        // Horizontal beams (skip lower crossbar across open gate archway)
        for (let ty = isOpenGate ? 1 : 0; ty <= 1; ty++) {
          const hBeam = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.1, 0.1, 0.12), timberMat);
          hBeam.position.set(0, b.h * (0.35 + ty * 0.4), b.d / 2 + 0.06);
          group.add(hBeam);
          // Back side
          const hBeamB = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.1, 0.1, 0.12), timberMat);
          hBeamB.position.set(0, b.h * (0.35 + ty * 0.4), -b.d / 2 - 0.06);
          group.add(hBeamB);
        }
        // Vertical corner beams
        for (let cx = -1; cx <= 1; cx += 2) {
          const vBeam = new THREE.Mesh(new THREE.BoxGeometry(0.1, b.h, 0.12), timberMat);
          vBeam.position.set(cx * b.w / 2, b.h / 2, b.d / 2 + 0.06);
          group.add(vBeam);
          const vBeamB = new THREE.Mesh(new THREE.BoxGeometry(0.1, b.h, 0.12), timberMat);
          vBeamB.position.set(cx * b.w / 2, b.h / 2, -b.d / 2 - 0.06);
          group.add(vBeamB);
        }
        // Side vertical beams
        for (let cz = -1; cz <= 1; cz += 2) {
          const sBeam = new THREE.Mesh(new THREE.BoxGeometry(0.12, b.h, 0.1), timberMat);
          sBeam.position.set(b.w / 2 + 0.06, b.h / 2, cz * b.d * 0.3);
          group.add(sBeam);
          const sBeam2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, b.h, 0.1), timberMat);
          sBeam2.position.set(-b.w / 2 - 0.06, b.h / 2, cz * b.d * 0.3);
          group.add(sBeam2);
        }
      }

      // ---- WINDOW SHUTTERS ----
      if (b.hasWindows) {
        const shutterMat = new THREE.MeshLambertMaterial({ color: 0x2a4a2a });
        const winSize = 0.6;
        // Front window shutters
        for (let wx = -1; wx <= 1; wx += 2) {
          for (let sx = -1; sx <= 1; sx += 2) {
            const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.18, winSize + 0.08, 0.05), shutterMat);
            shutter.position.set(wx * (b.w * 0.25) + sx * 0.32, b.h * 0.55, b.d / 2 + 0.1);
            group.add(shutter);
          }
        }
      }

      // ---- DOOR FRAME & FOUNDATION & STEP ----
      const frameMat = new THREE.MeshLambertMaterial({ color: 0x3a2a18 });
      if (!isOpenGate) {
        // Lintel
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.32, 0.08, 0.18), frameMat);
        lintel.position.set(0, b.h * 0.45, b.d / 2 + 0.1);
        group.add(lintel);
        // Door frame sides
        for (let ds = -1; ds <= 1; ds += 2) {
          const dFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, b.h * 0.45, 0.18), frameMat);
          dFrame.position.set(ds * b.w * 0.135, b.h * 0.22, b.d / 2 + 0.1);
          group.add(dFrame);
        }

        // ---- STONE FOUNDATION ----
        const foundationMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        const foundation = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.2, 0.2, b.d + 0.2), foundationMat);
        foundation.position.y = 0.1;
        group.add(foundation);

        // ---- FRONT DOORSTEP ----
        const stepMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        const step = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.35, 0.1, 0.3), stepMat);
        step.position.set(0, 0.05, b.d / 2 + 0.25);
        group.add(step);
      } else {
        const foundationMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        for (const side of [-1, 1]) {
          const pierBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, b.d + 0.2), foundationMat);
          pierBase.position.set(side * (b.w / 2 - 0.675), 0.1, 0);
          group.add(pierBase);
        }
      }

      // ---- ROOF TRIM ----
      const trimMat = new THREE.MeshLambertMaterial({ color: b.roofColor - 0x111111 });
      const roofTrimFront = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.3, 0.08, 0.08), trimMat);
      roofTrimFront.position.set(0, b.h, b.d / 2 + 0.1);
      group.add(roofTrimFront);
      const roofTrimBack = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.3, 0.08, 0.08), trimMat);
      roofTrimBack.position.set(0, b.h, -b.d / 2 - 0.1);
      group.add(roofTrimBack);
      // Side roof trim
      const roofTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, b.d + 0.3), trimMat);
      roofTrimL.position.set(-b.w / 2 - 0.1, b.h, 0);
      group.add(roofTrimL);
      const roofTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, b.d + 0.3), trimMat);
      roofTrimR.position.set(b.w / 2 + 0.1, b.h, 0);
      group.add(roofTrimR);

      // ---- WINDOW FLOWER BOXES ----
      if (b.hasWindows) {
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
        const flowerBoxColors = [0xff5577, 0xffaa44, 0xff66aa, 0xaa66ff];
        for (let wx = -1; wx <= 1; wx += 2) {
          // Box
          const fBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.15), boxMat);
          fBox.position.set(wx * (b.w * 0.25), b.h * 0.55 - 0.38, b.d / 2 + 0.12);
          group.add(fBox);
          // Tiny flowers
          for (let fi = 0; fi < 3; fi++) {
            const fc = flowerBoxColors[Math.floor(Math.random() * flowerBoxColors.length)];
            const tiny = new THREE.Mesh(
              new THREE.BoxGeometry(0.08, 0.1, 0.08),
              new THREE.MeshLambertMaterial({ color: fc })
            );
            tiny.position.set(
              wx * (b.w * 0.25) + (fi - 1) * 0.15,
              b.h * 0.55 - 0.28,
              b.d / 2 + 0.12
            );
            group.add(tiny);
          }
        }
      }

      // ---- WINDOW CROSS-PANES ----
      if (b.hasWindows) {
        const paneMat = new THREE.MeshLambertMaterial({ color: 0x2a2018 });
        for (let wx = -1; wx <= 1; wx += 2) {
          // Horizontal pane
          const hPane = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.12), paneMat);
          hPane.position.set(wx * (b.w * 0.25), b.h * 0.55, b.d / 2 + 0.07);
          group.add(hPane);
          // Vertical pane
          const vPane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.58, 0.12), paneMat);
          vPane.position.set(wx * (b.w * 0.25), b.h * 0.55, b.d / 2 + 0.07);
          group.add(vPane);
        }
      }

      // ---- X-PATTERN TIMBER BRACING ----
      if (b.hasWindows && b.h > 2.5) {
        // Diagonal cross on the front face between windows (decorative "X")
        const diagMat = new THREE.MeshLambertMaterial({ color: 0x3a2a18 });
        // Create X using two thin rotated boxes
        const diagLen = Math.sqrt(b.h * 0.3 * b.h * 0.3 + b.w * 0.2 * b.w * 0.2);
        const diagAngle = Math.atan2(b.h * 0.3, b.w * 0.2);
        for (let side = -1; side <= 1; side += 2) {
          const diag = new THREE.Mesh(new THREE.BoxGeometry(diagLen, 0.06, 0.1), diagMat);
          diag.position.set(0, b.h * 0.38, b.d / 2 + 0.07);
          diag.rotation.z = side * diagAngle;
          group.add(diag);
        }
      }

      // ---- DOOR AWNING / OVERHANG ----
      if (!isOpenGate) {
        const awningMat = new THREE.MeshLambertMaterial({ color: b.roofColor });
        const awning = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.4, 0.06, 0.5), awningMat);
        awning.position.set(0, b.h * 0.48, b.d / 2 + 0.3);
        awning.rotation.x = -0.15;
        group.add(awning);
        // Awning supports
        for (let as = -1; as <= 1; as += 2) {
          const aSup = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), timberMat);
          aSup.position.set(as * b.w * 0.18, b.h * 0.35, b.d / 2 + 0.45);
          aSup.rotation.x = -0.2;
          group.add(aSup);
        }
      }

      // ---- SECOND STORY COLOR BAND (for taller buildings) ----
      if (b.h > 3) {
        const upperMat = new THREE.MeshLambertMaterial({
          color: b.wallColor + 0x0a0a0a
        });
        const upperBand = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.02, b.h * 0.3, b.d + 0.02), upperMat);
        upperBand.position.y = b.h * 0.78;
        group.add(upperBand);
      }

      // ---- CHIMNEY CAP ----
      if (b.id === "tavern" || b.id === "forge") {
        const capMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), capMat);
        cap.position.set(b.w * 0.3, b.h + b.roofH * 0.6 + 1.05, -b.d * 0.2);
        group.add(cap);
        // Chimney pot
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.2, 6), capMat);
        pot.position.set(b.w * 0.3, b.h + b.roofH * 0.6 + 1.2, -b.d * 0.2);
        group.add(pot);
      }

      // ============ UNIQUE PER-BUILDING FEATURES ============

      // -- TAVERN: Porch with pillars, tankard emblem --
      if (b.id === "tavern") {
        // Porch roof
        const porchRoof = new THREE.Mesh(
          new THREE.BoxGeometry(b.w + 1, 0.1, 1.5),
          new THREE.MeshLambertMaterial({ color: b.roofColor })
        );
        porchRoof.position.set(0, b.h * 0.6, b.d / 2 + 0.8);
        group.add(porchRoof);
        // Porch pillars
        for (let pp = -1; pp <= 1; pp += 2) {
          const pillar = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, b.h * 0.6, 0.15),
            new THREE.MeshLambertMaterial({ color: 0x5a4030 })
          );
          pillar.position.set(pp * (b.w / 2 + 0.3), b.h * 0.3, b.d / 2 + 1.3);
          group.add(pillar);
        }
        // Railing between pillars
        const railing = new THREE.Mesh(
          new THREE.BoxGeometry(b.w + 0.8, 0.06, 0.06),
          new THREE.MeshLambertMaterial({ color: 0x5a4030 })
        );
        railing.position.set(0, 0.6, b.d / 2 + 1.3);
        group.add(railing);
        // Tankard emblem on sign
        const tankard = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.1, 0.2, 6),
          new THREE.MeshLambertMaterial({ color: 0xccaa55 })
        );
        tankard.position.set(0, b.h * 0.78, b.d / 2 + 0.08);
        group.add(tankard);
      }

      // -- WIZARD TOWER: Parapet, star emblem, extra window tiers --
      if (b.id === "wizard") {
        // Parapet at top
        for (let pi = 0; pi < 8; pi++) {
          const angle = (pi / 8) * Math.PI * 2;
          const merlon = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.4, 0.3),
            new THREE.MeshLambertMaterial({ color: 0x5a4a7a })
          );
          merlon.position.set(
            Math.cos(angle) * b.w * 0.45,
            b.h + 0.2,
            Math.sin(angle) * b.d * 0.45
          );
          group.add(merlon);
        }
        // Extra upper windows (smaller)
        const upperWinMat = new THREE.MeshBasicMaterial({ color: 0x8866ff });
        for (let uw = -1; uw <= 1; uw += 2) {
          const upperWin = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.1), upperWinMat);
          upperWin.position.set(uw * (b.w * 0.2), b.h * 0.82, b.d / 2 + 0.06);
          group.add(upperWin);
        }
        // Star emblem glowing
        const starEmblem = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.15, 0),
          new THREE.MeshBasicMaterial({ color: 0xaa88ff })
        );
        starEmblem.position.set(0, b.h * 0.78, b.d / 2 + 0.1);
        group.add(starEmblem);
      }

      // -- GALLERY: Balcony, colored trim --
      if (b.id === "gallery") {
        // Balcony
        const balconyFloor = new THREE.Mesh(
          new THREE.BoxGeometry(b.w * 0.6, 0.08, 1),
          new THREE.MeshLambertMaterial({ color: 0x5a4030 })
        );
        balconyFloor.position.set(0, b.h * 0.6, b.d / 2 + 0.6);
        group.add(balconyFloor);
        // Balcony railing
        for (let br = -1; br <= 1; br += 2) {
          const bPost = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), timberMat);
          bPost.position.set(br * b.w * 0.28, b.h * 0.6 + 0.25, b.d / 2 + 1);
          group.add(bPost);
        }
        const bRail = new THREE.Mesh(
          new THREE.BoxGeometry(b.w * 0.6, 0.04, 0.06),
          timberMat
        );
        bRail.position.set(0, b.h * 0.6 + 0.45, b.d / 2 + 1);
        group.add(bRail);
        // Colored trim accents
        const accentColors = [0xff6688, 0x6688ff, 0xffcc44];
        for (let ai = 0; ai < 3; ai++) {
          const accent = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshBasicMaterial({ color: accentColors[ai] })
          );
          accent.position.set((ai - 1) * 0.8, b.h * 0.92, b.d / 2 + 0.07);
          group.add(accent);
        }
      }

      // -- GATE: Arch decoration, raised portcullis lines, shield emblem --
      if (b.id === "gate") {
        // Arch over opening
        const archMat = new THREE.MeshLambertMaterial({ color: 0x5a5068 });
        const arch = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.48, 0.22, 0.3), archMat);
        arch.position.set(0, b.h * 0.56, b.d / 2 + 0.15);
        group.add(arch);
        // Raised portcullis bars (tucked into top of archway so road is open)
        const barMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        for (let pb = -3; pb <= 3; pb++) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), barMat);
          bar.position.set(pb * 0.25, b.h * 0.52, b.d / 2 + 0.12);
          group.add(bar);
        }
        const hBar = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.42, 0.05, 0.05), barMat);
        hBar.position.set(0, b.h * 0.48, b.d / 2 + 0.12);
        group.add(hBar);
        // Shield emblem
        const shieldMat = new THREE.MeshLambertMaterial({ color: 0xccaa33 });
        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.08), shieldMat);
        shield.position.set(0, b.h * 0.78, b.d / 2 + 0.1);
        group.add(shield);
        const shieldCenter = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.15, 0.1),
          new THREE.MeshBasicMaterial({ color: 0xcc2244 })
        );
        shieldCenter.position.set(0, b.h * 0.78, b.d / 2 + 0.12);
        group.add(shieldCenter);
      }

      // -- FORGE: Anvil-shaped sign, bellows, extra smoke hood --
      if (b.id === "forge") {
        // Smoke hood over front
        const hoodMat = new THREE.MeshLambertMaterial({ color: 0x3a3030 });
        const hood = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.5, 0.15, 0.8), hoodMat);
        hood.position.set(0, b.h * 0.75, b.d / 2 + 0.5);
        hood.rotation.x = -0.2;
        group.add(hood);
        // Metal accents on walls
        const metalAccent = new THREE.MeshLambertMaterial({ color: 0x555555 });
        for (let ma = 0; ma < 3; ma++) {
          const stud = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), metalAccent);
          stud.position.set((ma - 1) * 0.6, b.h * 0.3, b.d / 2 + 0.07);
          group.add(stud);
        }
      }

      // -- EXIT: Cross/compass decoration --
      if (b.id === "exit") {
        // Compass rose flat on front
        const compassMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
        const compassH = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), compassMat);
        compassH.position.set(0, b.h * 0.75, b.d / 2 + 0.08);
        group.add(compassH);
        const compassV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), compassMat);
        compassV.position.set(0, b.h * 0.75, b.d / 2 + 0.08);
        group.add(compassV);
        // Diagonal
        const compassD1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.06), compassMat);
        compassD1.position.set(0, b.h * 0.75, b.d / 2 + 0.08);
        compassD1.rotation.z = Math.PI / 4;
        group.add(compassD1);
        const compassD2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.06), compassMat);
        compassD2.position.set(0, b.h * 0.75, b.d / 2 + 0.08);
        compassD2.rotation.z = -Math.PI / 4;
        group.add(compassD2);
      }

      // -- NOTICEBOARD: Pinned papers, corkboard --
      if (b.id === "noticeboard") {
        // Cork board
        const corkMat = new THREE.MeshLambertMaterial({ color: 0x9a7a5a });
        const cork = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.7, b.h * 0.4, 0.06), corkMat);
        cork.position.set(0, b.h * 0.7, b.d / 2 + 0.08);
        group.add(cork);
        // Posted papers
        const paperColors = [0xeeeecc, 0xddddbb, 0xffffee, 0xccccaa];
        for (let pp = 0; pp < 4; pp++) {
          const paper = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.3, 0.02),
            new THREE.MeshLambertMaterial({ color: paperColors[pp] })
          );
          paper.position.set(
            (pp % 2 - 0.5) * 0.45,
            b.h * (0.62 + Math.floor(pp / 2) * 0.15),
            b.d / 2 + 0.12
          );
          paper.rotation.z = (Math.random() - 0.5) * 0.15;
          group.add(paper);
        }
      }

      // -- QUEST BOARD: Visible scrolls/quests pinned --
      if (b.id === "questboard") {
        // Extra visible quest papers
        const questPaperMat = new THREE.MeshLambertMaterial({ color: 0xddccaa });
        for (let qp = 0; qp < 3; qp++) {
          const qPaper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.02), questPaperMat);
          qPaper.position.set((qp - 1) * 0.4, b.h * 0.55, b.d / 2 + 0.08);
          qPaper.rotation.z = (Math.random() - 0.5) * 0.1;
          group.add(qPaper);
          // Wax seal
          const seal = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.02, 6),
            new THREE.MeshLambertMaterial({ color: 0xcc2222 })
          );
          seal.position.set((qp - 1) * 0.4, b.h * 0.45, b.d / 2 + 0.1);
          seal.rotation.x = Math.PI / 2;
          group.add(seal);
        }
      }

      group.position.set(b.x, 0, b.z);
      if (b.rotY) group.rotation.y = b.rotY;
      scene.add(group);

      // Collision bounds (AABB)
      const pad = 0.5;
      if (isOpenGate) {
        // Gate piers & flanking guard towers leave the central road archway walkable
        addCollider(b.x - 4.2, b.x - 1.35, b.z - b.d / 2 - pad, b.z + b.d / 2 + pad, "gate-west");
        addCollider(b.x + 1.35, b.x + 4.2, b.z - b.d / 2 - pad, b.z + b.d / 2 + pad, "gate-east");
      } else {
        addCollider(
          b.x - b.w / 2 - pad,
          b.x + b.w / 2 + pad,
          b.z - b.d / 2 - pad,
          b.z + b.d / 2 + pad,
          b.id
        );
      }

      // ====== FLOATING BEACON MARKER above building ======
      const beaconColors: Record<string, number> = {
        gate: 0xffdd44,
        tavern: 0xff8833,
        questboard: 0x44ddff,
        wizard: 0xaa66ff,
        gallery: 0xff66aa,
        forge: 0xff4422,
        noticeboard: 0x44ff66,
        exit: 0xffffff,
      };
      const beaconColor = beaconColors[b.id] || 0xffdd44;
      const beaconMat = new THREE.MeshBasicMaterial({ color: beaconColor, transparent: true, opacity: 0.85 });
      const beaconGeo = new THREE.OctahedronGeometry(0.3, 0);
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      const beaconBaseY = b.h + b.roofH + 1.5;
      beacon.position.set(b.x, beaconBaseY, b.z);
      scene.add(beacon);

      // Beacon glow (larger transparent sphere)
      const glowMat = new THREE.MeshBasicMaterial({ color: beaconColor, transparent: true, opacity: 0.15 });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), glowMat);
      glow.position.set(b.x, beaconBaseY, b.z);
      scene.add(glow);

      beacons.push({ mesh: beacon, glow, baseY: beaconBaseY });

      // Small sign post at building entrance
      const signPostMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
      const signBoardMat = new THREE.MeshLambertMaterial({ color: 0x5a4030 });
      const entranceSign = new THREE.Group();
      const sPost = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.08), signPostMat);
      sPost.position.y = 0.9;
      entranceSign.add(sPost);
      const sBoard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.06), signBoardMat);
      sBoard.position.y = 1.7;
      entranceSign.add(sBoard);
      // Colored stripe on sign matching beacon
      const stripeMat = new THREE.MeshBasicMaterial({ color: beaconColor });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.07), stripeMat);
      stripe.position.y = 1.55;
      entranceSign.add(stripe);
      entranceSign.position.set(b.x + b.w / 2 + 0.8, 0, b.z + b.d / 2);
      scene.add(entranceSign);
    });

    // ====== DECORATIONS ======
    // Trees
    const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x6a4a30 });
    const treeLeafMat = new THREE.MeshLambertMaterial({ color: 0x2a7a2a });
    const treeLeafMat2 = new THREE.MeshLambertMaterial({ color: 0x3a8a3a });

    const addTree = (x: number, z: number, h: number = 3) => {
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.5, h, 0.5), treeTrunkMat);
      trunk.position.set(x, h / 2, z);
      trunk.castShadow = true;
      scene.add(trunk);

      const leaves = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        Math.random() > 0.5 ? treeLeafMat : treeLeafMat2
      );
      leaves.position.set(x, h + 1, z);
      leaves.castShadow = true;
      scene.add(leaves);

      const top = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), treeLeafMat2);
      top.position.set(x, h + 2, z);
      top.castShadow = true;
      scene.add(top);

      // Add tree collision
      addCollider(x - 0.5, x + 0.5, z - 0.5, z + 0.5, "tree");
    };

    // ====== OAK TREE (rounded, layered canopy) ======
    const addOak = (x: number, z: number, h: number = 3) => {
      const tGroup = new THREE.Group();
      // Trunk with bark detail
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6), new THREE.MeshLambertMaterial({ color: 0x5a3a1a }));
      trunk.position.y = h / 2;
      trunk.castShadow = true;
      tGroup.add(trunk);
      // Roots
      for (let r = 0; r < 3; r++) {
        const angle = (r / 3) * Math.PI * 2 + Math.random() * 0.5;
        const root = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.6), new THREE.MeshLambertMaterial({ color: 0x4a2a10 }));
        root.position.set(Math.cos(angle) * 0.4, 0.07, Math.sin(angle) * 0.4);
        root.rotation.y = angle;
        tGroup.add(root);
      }
      // Multi-layered canopy
      const leafColors = [0x2a7a2a, 0x3a8a3a, 0x2a6a22, 0x4a9a40];
      const canopyLayers = [
        { y: h + 0.5, s: 2.2 },
        { y: h + 1.2, s: 2.0 },
        { y: h + 1.8, s: 1.5 },
        { y: h + 2.3, s: 0.9 },
      ];
      canopyLayers.forEach(({ y, s }, i) => {
        const leaf = new THREE.Mesh(
          new THREE.BoxGeometry(s, 0.8, s),
          new THREE.MeshLambertMaterial({ color: leafColors[i % leafColors.length] })
        );
        leaf.position.y = y;
        leaf.rotation.y = i * 0.3;
        leaf.castShadow = true;
        tGroup.add(leaf);
      });
      // Branch stubs
      for (let b = 0; b < 2; b++) {
        const branch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.8), new THREE.MeshLambertMaterial({ color: 0x5a3a1a }));
        branch.position.set(b === 0 ? 0.5 : -0.5, h * 0.7, 0);
        branch.rotation.z = b === 0 ? -0.4 : 0.4;
        tGroup.add(branch);
      }
      tGroup.position.set(x, 0, z);
      scene.add(tGroup);
      addCollider(x - 0.5, x + 0.5, z - 0.5, z + 0.5, "oak");
      // Undergrowth
      for (let ug = 0; ug < 3; ug++) {
        const ugBush = new THREE.Mesh(
          new THREE.BoxGeometry(0.4 + Math.random() * 0.3, 0.25, 0.4 + Math.random() * 0.3),
          new THREE.MeshLambertMaterial({ color: [0x3a6a28, 0x4a7a38, 0x2a5a1a][ug] })
        );
        ugBush.position.set(x + (Math.random() - 0.5) * 1.5, 0.12, z + (Math.random() - 0.5) * 1.5);
        scene.add(ugBush);
      }
    };

    // ====== PINE TREE (conical, tiered) ======
    const addPine = (x: number, z: number, h: number = 3.5) => {
      const tGroup = new THREE.Group();
      // Thin trunk
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, 0.3), new THREE.MeshLambertMaterial({ color: 0x4a3018 }));
      trunk.position.y = h / 2;
      trunk.castShadow = true;
      tGroup.add(trunk);
      // Tiered cone layers (bottom to top)
      const tiers = 4;
      for (let t = 0; t < tiers; t++) {
        const tierH = 0.8;
        const tierW = 2.2 - t * 0.45;
        const tierY = h * 0.4 + t * 0.9;
        const tier = new THREE.Mesh(
          new THREE.ConeGeometry(tierW / 2, tierH, 4),
          new THREE.MeshLambertMaterial({ color: [0x1a5a1a, 0x2a6a2a, 0x1a5a22, 0x2a7a2a][t] })
        );
        tier.position.y = tierY;
        tier.rotation.y = Math.PI / 4 + t * 0.2;
        tier.castShadow = true;
        tGroup.add(tier);
      }
      tGroup.position.set(x, 0, z);
      scene.add(tGroup);
      addCollider(x - 0.4, x + 0.4, z - 0.4, z + 0.4, "pine");
    };

    // ====== BIRCH TREE (white bark, delicate) ======
    const addBirch = (x: number, z: number, h: number = 3) => {
      const tGroup = new THREE.Group();
      // White trunk
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, 0.3), new THREE.MeshLambertMaterial({ color: 0xd8d0c0 }));
      trunk.position.y = h / 2;
      trunk.castShadow = true;
      tGroup.add(trunk);
      // Dark bark marks
      for (let bm = 0; bm < 4; bm++) {
        const mark = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.06, 0.32),
          new THREE.MeshLambertMaterial({ color: 0x3a3530 })
        );
        mark.position.y = 0.5 + bm * 0.7;
        tGroup.add(mark);
      }
      // Lighter, more spread leaves
      const birchLeafMat = new THREE.MeshLambertMaterial({ color: 0x5aaa3a });
      const birchLeafMat2 = new THREE.MeshLambertMaterial({ color: 0x6aba4a });
      for (let cl = 0; cl < 5; cl++) {
        const leaf = new THREE.Mesh(
          new THREE.BoxGeometry(1.0 + Math.random() * 0.5, 0.5, 1.0 + Math.random() * 0.5),
          cl % 2 === 0 ? birchLeafMat : birchLeafMat2
        );
        leaf.position.set(
          (Math.random() - 0.5) * 1.2,
          h + 0.3 + cl * 0.35,
          (Math.random() - 0.5) * 1.2
        );
        leaf.rotation.y = Math.random() * Math.PI;
        leaf.castShadow = true;
        tGroup.add(leaf);
      }
      tGroup.position.set(x, 0, z);
      scene.add(tGroup);
      addCollider(x - 0.4, x + 0.4, z - 0.4, z + 0.4, "birch");
    };

    // Scatter trees (mixed types)
    addOak(-14, -8);
    addPine(-12, 4);
    addOak(14, 5, 4);
    addBirch(13, -3);
    addPine(-13, -6, 3.5);
    addBirch(-6, -10, 2.5);
    addOak(6, -12);
    addPine(-15, 10, 4);
    addOak(15, 12, 3);
    addBirch(-4, -14, 3.5);
    addPine(12, -12, 2.5);
    addOak(-16, 6, 3);
    addPine(16, 8, 3.5);
    addBirch(-10, -14, 2.8);
    addOak(10, 14, 3.2);
    addPine(-16, -6, 4);
    addBirch(16, -8, 2.5);
    addOak(-8, 14, 3);

    // Outer perimeter forest silhouettes (outside walkable zones to frame the horizon)
    const outerTreeSpots: [number, number, "oak" | "pine", number][] = [
      [-23, 24, "pine", 4.2], [-18, 26, "oak", 3.4], [-12, 24, "pine", 3.8], [-6, 25, "pine", 4.0],
      [6, 25, "oak", 3.6], [13, 24, "pine", 4.2], [20, 22, "oak", 3.5], [24, 16, "pine", 4.4],
      [-24, -18, "oak", 3.5], [-18, -24, "pine", 4.4], [18, -23, "oak", 3.8], [24, -17, "pine", 4.0],
      [-39, 15, "pine", 4.8], [-39, 2, "oak", 4.0], [-38, -10, "pine", 4.6], [41, -14, "pine", 4.5],
      [41, 10, "oak", 3.8], [-15, 31, "pine", 4.5], [14, 30, "oak", 3.8], [-18, -36, "pine", 4.6],
      [0, -39, "oak", 4.2], [17, -36, "pine", 4.4],
    ];
    outerTreeSpots.forEach(([ox, oz, kind, oh]) => {
      if (kind === "oak") {
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.6, oh, 0.6), treeTrunkMat);
        trunk.position.set(ox, oh / 2 - 0.38, oz);
        scene.add(trunk);
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.8, 2.3), treeLeafMat);
        canopy.position.set(ox, oh + 0.6 - 0.38, oz);
        scene.add(canopy);
      } else {
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.35, oh, 0.35), treeTrunkMat);
        trunk.position.set(ox, oh / 2 - 0.38, oz);
        scene.add(trunk);
        const tier1 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.5, 4), treeLeafMat);
        tier1.position.set(ox, oh * 0.55 - 0.38, oz);
        tier1.rotation.y = Math.PI / 4;
        scene.add(tier1);
        const tier2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.3, 4), treeLeafMat2);
        tier2.position.set(ox, oh * 0.9 - 0.38, oz);
        tier2.rotation.y = Math.PI / 4;
        scene.add(tier2);
      }
    });

    // Barrels near tavern
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x5c3d2e });
    const addBarrel = (x: number, z: number) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.7, 6), barrelMat);
      barrel.position.set(x, 0.35, z);
      barrel.castShadow = true;
      scene.add(barrel);
    };
    addBarrel(-5.5, 9);
    addBarrel(-5.8, 8.5);
    addBarrel(-5.3, 8);
    addBarrel(-10, -3.5);
    addBarrel(11, 0.5);
    addBarrel(7.5, -1);
    addBarrel(-4, 14.5);
    addBarrel(4, 14.5);

    // Crates
    const crateMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
    const addCrate = (x: number, z: number) => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), crateMat);
      crate.position.set(x, 0.3, z);
      crate.rotation.y = Math.random() * 0.5;
      crate.castShadow = true;
      scene.add(crate);
    };
    addCrate(6.5, 0.5);
    addCrate(6.2, 1);
    addCrate(-7, -4);
    addCrate(9, -1.5);
    addCrate(-12, 7);
    addCrate(3, 14);
    addCrate(-3, 14);

    // Well tucked neatly on the southeast courtyard between Gate and Notice Board
    const wellX = 4.5;
    const wellZ = 11.0;
    const wellMat = new THREE.MeshLambertMaterial({ color: 0x5a5565 });
    const well = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 1, 8), wellMat);
    well.position.set(wellX, 0.5, wellZ);
    well.castShadow = true;
    scene.add(well);
    addCollider(wellX - 0.75, wellX + 0.75, wellZ - 0.75, wellZ + 0.75, "well");
    const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1, 4), new THREE.MeshLambertMaterial({ color: 0x5c3d2e }));
    wellRoof.position.set(wellX, 2.3, wellZ);
    wellRoof.rotation.y = Math.PI / 4;
    scene.add(wellRoof);
    // Well supports
    for (let i = 0; i < 2; i++) {
      const sup = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), new THREE.MeshLambertMaterial({ color: 0x4a3020 }));
      sup.position.set(wellX + (i === 0 ? -0.6 : 0.6), 1.5, wellZ);
      scene.add(sup);
    }

    // Fence posts along edges (skipping open road gates)
    for (let i = -18; i <= 18; i += 3) {
      if (Math.abs(i) >= 3) {
        [[-20, i], [20, i]].forEach(([fx, fz]) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), fenceMat);
          post.position.set(fx as number, 0.75, fz as number);
          scene.add(post);
        });
        [[i, -18], [i, 20]].forEach(([fx, fz]) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), fenceMat);
          post.position.set(fx as number, 0.75, fz as number);
          scene.add(post);
        });
      }
    }

    // ====== LANTERN POSTS along paths ======
    const torchLights: { light: THREE.PointLight; baseIntensity: number }[] = [];
    const lanternPostMat = new THREE.MeshLambertMaterial({ color: 0x3a3020 });
    const lanternGlassMat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });

    const addLanternPost = (x: number, z: number) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.15), lanternPostMat);
      post.position.set(x, 1.25, z);
      post.castShadow = true;
      scene.add(post);
      // Lantern top
      const lanternBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.3), new THREE.MeshLambertMaterial({ color: 0x2a2018 }));
      lanternBody.position.set(x, 2.65, z);
      scene.add(lanternBody);
      const lanternGlass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), lanternGlassMat);
      lanternGlass.position.set(x, 2.65, z);
      scene.add(lanternGlass);
      // Lantern roof
      const lanternRoof = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 4), lanternPostMat);
      lanternRoof.position.set(x, 2.95, z);
      lanternRoof.rotation.y = Math.PI / 4;
      scene.add(lanternRoof);
      // Add a point light
      const lanternLight = new THREE.PointLight(0xffaa33, 1.5, 8, 1.5);
      lanternLight.position.set(x, 2.65, z);
      scene.add(lanternLight);
      torchLights.push({ light: lanternLight, baseIntensity: 1.5 });
    };

    // Lanterns along main road
    addLanternPost(-2, 6);
    addLanternPost(2, 6);
    addLanternPost(-2, 0);
    addLanternPost(2, 0);
    addLanternPost(-2, -6);
    addLanternPost(2, -6);
    // Lanterns along east-west road
    addLanternPost(6, -2);
    addLanternPost(-6, -2);
    addLanternPost(6, 2);
    addLanternPost(-6, 2);

    // ====== STONE WALLS around town perimeter ======
    const wallMat2 = new THREE.MeshLambertMaterial({ color: 0x5a5565 });
    const addWallSegment = (x: number, z: number, w: number, d: number, h: number = 1.5) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat2);
      wall.position.set(x, h / 2, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      addCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2, "wall");
    };
    // North wall
    for (let i = -16; i <= 16; i += 4) {
      if (Math.abs(i) < 3) continue; // gap for road
      addWallSegment(i, -16, 4, 0.8);
    }
    // South wall
    for (let i = -16; i <= 16; i += 4) {
      if (Math.abs(i) < 3) continue; // gate gap
      addWallSegment(i, 18, 4, 0.8);
    }
    // East wall (open gate gap at z in [-2, 2])
    for (const z of [-14, -10, -6, 6, 10, 14]) {
      addWallSegment(18, z, 0.8, 4);
    }
    addWallSegment(18, -2.8, 1.1, 1.4, 2.5);
    addWallSegment(18, 2.8, 1.1, 1.4, 2.5);
    // West wall (open gate gap at z in [-2, 2])
    for (const z of [-14, -10, -6, 6, 10, 14]) {
      addWallSegment(-18, z, 0.8, 4);
    }
    addWallSegment(-18, -2.8, 1.1, 1.4, 2.5);
    addWallSegment(-18, 2.8, 1.1, 1.4, 2.5);
    // Wall merlon / battlement details
    for (let i = -16; i <= 16; i += 2) {
      if (Math.abs(i) < 3) continue;
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.9), wallMat2);
      merlon.position.set(i, 1.75, -16);
      scene.add(merlon);
      const merlon2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.9), wallMat2);
      merlon2.position.set(i, 1.75, 18);
      scene.add(merlon2);
    }

    // ====== MARKET STALL (near town square) ======
    const stallWoodMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
    const stallCanvasMat = new THREE.MeshLambertMaterial({ color: 0xaa3333 });
    const stallCanvasMat2 = new THREE.MeshLambertMaterial({ color: 0x3355aa });

    const addMarketStall = (x: number, z: number, canvasColor: THREE.MeshLambertMaterial) => {
      // Counter
      const counter = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 1), stallWoodMat);
      counter.position.set(x, 0.4, z);
      counter.castShadow = true;
      scene.add(counter);
      addCollider(x - 1.0, x + 1.0, z - 0.5, z + 0.5, "stall");
      // Posts
      for (let px = -0.8; px <= 0.8; px += 1.6) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2, 0.12), stallWoodMat);
        post.position.set(x + px, 1, z - 0.4);
        scene.add(post);
      }
      // Awning
      const awning = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.4), canvasColor);
      awning.position.set(x, 2, z - 0.1);
      awning.rotation.x = -0.15;
      scene.add(awning);
      // Items on counter (small boxes / spheres)
      for (let ix = -0.6; ix <= 0.6; ix += 0.4) {
        const item = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.2, 0.2),
          new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0xddaa33 : 0x55aa55 })
        );
        item.position.set(x + ix, 0.9, z);
        scene.add(item);
      }
    };

    addMarketStall(-4, 3, stallCanvasMat);
    addMarketStall(-4, -6, stallCanvasMat2);

    // ====== FLOWER PATCHES / GARDENS ======
    const gardenFlowerColors = [0xff6688, 0xffaa44, 0xaa66ff, 0xff4466, 0x66aaff, 0xffdd44];
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x4a6a38 });

    const addFlowerPatch = (cx: number, cz: number, count: number = 8) => {
      // Grass base
      const grassBase = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 1.5), grassMat);
      grassBase.position.set(cx, 0.07, cz);
      scene.add(grassBase);
      for (let i = 0; i < count; i++) {
        const fx = cx + (Math.random() - 0.5) * 1.6;
        const fz = cz + (Math.random() - 0.5) * 1.2;
        const flowerMat = new THREE.MeshLambertMaterial({
          color: gardenFlowerColors[Math.floor(Math.random() * gardenFlowerColors.length)]
        });
        // Stem
        const stem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), new THREE.MeshLambertMaterial({ color: 0x3a6a2a }));
        stem.position.set(fx, 0.25, fz);
        scene.add(stem);
        // Flower head
        const flower = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), flowerMat);
        flower.position.set(fx, 0.45, fz);
        scene.add(flower);
      }
    };

    addFlowerPatch(-3, 5);
    addFlowerPatch(7, -7);
    addFlowerPatch(-12, 1);
    addFlowerPatch(12, 7);
    addFlowerPatch(-7, -12);

    // ====== BRIDGE over pond ======
    const bridgeWoodMat = new THREE.MeshLambertMaterial({ color: 0x5a3a20 });
    // Bridge planks
    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 5), bridgeWoodMat);
    bridgeDeck.position.set(5, 0.3, -5);
    scene.add(bridgeDeck);
    // Pond water colliders flanking the walkable bridge deck (x in [4.25, 5.75])
    addCollider(2.9, 4.15, -7.0, -3.0, "pond-west");
    addCollider(5.85, 8.2, -7.0, -3.0, "pond-east-pier");
    // Bridge railings
    for (let side = -1; side <= 1; side += 2) {
      for (let pz = -2; pz <= 2; pz += 1) {
        const railing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), bridgeWoodMat);
        railing.position.set(5 + side * 0.7, 0.6, -5 + pz);
        scene.add(railing);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 5), bridgeWoodMat);
      rail.position.set(5 + side * 0.7, 0.9, -5);
      scene.add(rail);
    }

    // ====== HAY BALES ======
    const hayMat = new THREE.MeshLambertMaterial({ color: 0xccaa55 });
    const addHayBale = (x: number, z: number) => {
      const hay = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8), hayMat);
      hay.position.set(x, 0.25, z);
      hay.rotation.z = Math.PI / 2;
      hay.castShadow = true;
      scene.add(hay);
    };
    addHayBale(-11, 6);
    addHayBale(-11.5, 5.5);
    addHayBale(13, 0);
    addHayBale(13, 0.8);

    // ====== SIGNPOSTS ======
    const signMat = new THREE.MeshLambertMaterial({ color: 0x5a4030 });
    const addSignpost = (x: number, z: number, rotY: number = 0) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2, 0.12), signMat);
      post.position.set(x, 1, z);
      post.castShadow = true;
      scene.add(post);
      // Sign boards pointing in directions
      for (let i = 0; i < 2; i++) {
        const board = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 0.08), signMat);
        board.position.set(x + 0.4, 1.8 - i * 0.45, z);
        board.rotation.y = rotY + i * 0.4;
        scene.add(board);
      }
    };
    addSignpost(0, 8, 0.2);
    addSignpost(3, -3, -0.3);

    // ====== MUSHROOMS (near trees) ======
    const mushroomCapMat = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
    const mushroomStemMat = new THREE.MeshLambertMaterial({ color: 0xeeeecc });
    const addMushroom = (x: number, z: number, scale: number = 1) => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * scale, 0.08 * scale, 0.2 * scale, 6), mushroomStemMat);
      stem.position.set(x, 0.1 * scale, z);
      scene.add(stem);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.15 * scale, 0.12 * scale, 6), mushroomCapMat);
      cap.position.set(x, 0.25 * scale, z);
      scene.add(cap);
    };
    addMushroom(-13.5, -7.5);
    addMushroom(-13.2, -7.8, 0.7);
    addMushroom(6.5, -11.5);
    addMushroom(-5.5, -9.5, 0.8);
    addMushroom(14.5, 5.5, 0.6);

    // ====== COBBLESTONE DETAILS on paths ======
    const cobbleMat = new THREE.MeshLambertMaterial({ color: 0x6a5a48 });
    for (let i = 0; i < 30; i++) {
      const cx = (Math.random() - 0.5) * 2.5;
      const cz = -12 + Math.random() * 24;
      const cobble = new THREE.Mesh(
        new THREE.BoxGeometry(0.3 + Math.random() * 0.2, 0.05, 0.3 + Math.random() * 0.2),
        cobbleMat
      );
      cobble.position.set(cx, 0.08, cz);
      cobble.rotation.y = Math.random() * Math.PI;
      scene.add(cobble);
    }
    // East-west road cobbles
    for (let i = 0; i < 20; i++) {
      const cx = -10 + Math.random() * 20;
      const cz = (Math.random() - 0.5) * 2.5;
      const cobble = new THREE.Mesh(
        new THREE.BoxGeometry(0.3 + Math.random() * 0.2, 0.05, 0.3 + Math.random() * 0.2),
        cobbleMat
      );
      cobble.position.set(cx, 0.08, cz);
      cobble.rotation.y = Math.random() * Math.PI;
      scene.add(cobble);
    }

    // ====== WATER REEDS near pond ======
    const waterReedMat = new THREE.MeshLambertMaterial({ color: 0x3a6a3a });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = 5 + Math.cos(angle) * 2.3;
      const rz = -5 + Math.sin(angle) * 2.3;
      const reed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6 + Math.random() * 0.4, 0.04), waterReedMat);
      reed.position.set(rx, 0.4, rz);
      reed.rotation.z = (Math.random() - 0.5) * 0.2;
      scene.add(reed);
    }

    // ====== BUILDING-SPECIFIC PROPS ======

    // -- FORGE: Anvil, quenching trough, glowing coals --
    const anvilMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.4), anvilMat);
    anvil.position.set(-7.5, 0.25, -2);
    anvil.castShadow = true;
    scene.add(anvil);
    // Anvil horn
    const anvilHorn = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.6), anvilMat);
    anvilHorn.position.set(-7.5, 0.45, -2);
    scene.add(anvilHorn);
    // Quenching trough
    const troughMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
    const trough = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.5), troughMat);
    trough.position.set(-7.2, 0.2, -3.2);
    scene.add(trough);
    const troughWater = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.3), waterMat);
    troughWater.position.set(-7.2, 0.35, -3.2);
    scene.add(troughWater);
    // Glowing coal pile
    const coalMat = new THREE.MeshBasicMaterial({ color: 0xff3311 });
    const coals = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.5), coalMat);
    coals.position.set(-8, 0.08, -0.5);
    scene.add(coals);
    // Hanging tools on wall
    for (let i = 0; i < 3; i++) {
      const tool = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.6, 0.06),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
      );
      tool.position.set(-11.05, 1.5 + i * 0.15, -2 + i * 0.5);
      tool.rotation.z = 0.1;
      scene.add(tool);
    }

    // -- TAVERN: Outdoor tables, benches, mugs, hanging sign --
    const tableMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    const addTable = (x: number, z: number) => {
      // Table top
      const top = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.8), tableMat);
      top.position.set(x, 0.7, z);
      top.castShadow = true;
      scene.add(top);
      // 4 legs
      for (let lx = -0.4; lx <= 0.4; lx += 0.8) {
        for (let lz = -0.3; lz <= 0.3; lz += 0.6) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), tableMat);
          leg.position.set(x + lx, 0.35, z + lz);
          scene.add(leg);
        }
      }
      // Mug on table
      const mugMat = new THREE.MeshLambertMaterial({ color: 0x8a6a4a });
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 6), mugMat);
      mug.position.set(x + 0.2, 0.8, z);
      scene.add(mug);
      // Plate
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 8), new THREE.MeshLambertMaterial({ color: 0xccbbaa }));
      plate.position.set(x - 0.15, 0.76, z + 0.1);
      scene.add(plate);
    };
    addTable(-5.5, 10.5);
    addTable(-5.5, 11.5);
    // Bench
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    const addBench = (x: number, z: number, rotY: number = 0) => {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.3), benchMat);
      seat.position.set(x, 0.4, z);
      seat.rotation.y = rotY;
      scene.add(seat);
      for (let lx = -0.5; lx <= 0.5; lx += 1) {
        const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), benchMat);
        bLeg.position.set(x + lx * Math.cos(rotY), 0.2, z + lx * Math.sin(rotY));
        scene.add(bLeg);
      }
    };
    addBench(-6.5, 10.5);
    addBench(-6.5, 11.5);
    // Tavern hanging sign
    const tavernSignPost = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), tableMat);
    tavernSignPost.position.set(-5.5, 2.5, 10.2);
    scene.add(tavernSignPost);
    const tavernSignArm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.06), tableMat);
    tavernSignArm.position.set(-5, 3.2, 10.2);
    scene.add(tavernSignArm);
    const tavernSignBoard = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.06), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }));
    tavernSignBoard.position.set(-4.7, 2.85, 10.2);
    scene.add(tavernSignBoard);

    // -- GALLERY: Easels with canvases outside --
    const easelMat = new THREE.MeshLambertMaterial({ color: 0x5a4030 });
    const addEasel = (x: number, z: number, canvasColor: number) => {
      // A-frame legs
      const legA = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.06), easelMat);
      legA.position.set(x - 0.15, 0.75, z);
      legA.rotation.z = 0.08;
      scene.add(legA);
      const legB = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.06), easelMat);
      legB.position.set(x + 0.15, 0.75, z);
      legB.rotation.z = -0.08;
      scene.add(legB);
      // Back support
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.06), easelMat);
      back.position.set(x, 0.65, z - 0.2);
      back.rotation.x = 0.25;
      scene.add(back);
      // Canvas
      const canvas = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.5, 0.04),
        new THREE.MeshLambertMaterial({ color: canvasColor })
      );
      canvas.position.set(x, 1.2, z + 0.05);
      scene.add(canvas);
    };
    addEasel(11.5, 1, 0x4488cc);
    addEasel(11.5, -1, 0xcc6644);
    // Paint palette on the ground
    const palette = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 8), new THREE.MeshLambertMaterial({ color: 0x8a6a4a }));
    palette.position.set(11.3, 0.02, 0);
    scene.add(palette);
    // Paint dots on palette
    [0xff3333, 0x3333ff, 0xffff33, 0x33ff33].forEach((c, i) => {
      const dot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), new THREE.MeshBasicMaterial({ color: c }));
      dot.position.set(11.3 + (i % 2) * 0.1 - 0.05, 0.05, (Math.floor(i / 2)) * 0.1 - 0.05);
      scene.add(dot);
    });

    // -- WIZARD TOWER: Floating crystals (animated), magic circle --
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0x8844ff, transparent: true, opacity: 0.7 });
    const crystals: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), crystalMat);
      crystal.position.set(
        Math.cos(angle) * 2.5,
        4,
        -10 + Math.sin(angle) * 2.5
      );
      scene.add(crystal);
      crystals.push(crystal);
    }
    // Magic circle on ground
    const magicCircleMat = new THREE.MeshBasicMaterial({ color: 0x6622cc, transparent: true, opacity: 0.2 });
    const magicCircle = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.7, 16), magicCircleMat);
    magicCircle.rotation.x = -Math.PI / 2;
    magicCircle.position.set(0, 0.05, -10);
    scene.add(magicCircle);
    // Inner circle
    const innerCircle = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.95, 12), magicCircleMat);
    innerCircle.rotation.x = -Math.PI / 2;
    innerCircle.position.set(0, 0.05, -10);
    scene.add(innerCircle);

    // -- GATE: Guard tower extension, flag, torches --
    // Gate tower posts
    for (let side = -1; side <= 1; side += 2) {
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 7, 1.2),
        new THREE.MeshLambertMaterial({ color: 0x6a6078 })
      );
      tower.position.set(side * 3.5, 3.5, 14);
      tower.castShadow = true;
      scene.add(tower);
      // Tower top battlement
      const battlement = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), new THREE.MeshLambertMaterial({ color: 0x6a6078 }));
      battlement.position.set(side * 3.5, 7.25, 14);
      scene.add(battlement);
    }
    // Flag on right tower
    const flagPole = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2, 0.06), new THREE.MeshLambertMaterial({ color: 0x4a3020 }));
    flagPole.position.set(3.5, 8.5, 14);
    scene.add(flagPole);
    const flagMat = new THREE.MeshLambertMaterial({ color: 0xcc2244, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 0.02), flagMat);
    flag.position.set(4.1, 9.2, 14);
    scene.add(flag);

    // ====== CAMPFIRE (near town center) ======
    const campfireGroup = new THREE.Group();
    // Stone ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.2, 0.25),
        new THREE.MeshLambertMaterial({ color: 0x555555 + Math.floor(Math.random() * 0x111111) })
      );
      stone.position.set(Math.cos(angle) * 0.5, 0.1, Math.sin(angle) * 0.5);
      stone.rotation.y = angle;
      campfireGroup.add(stone);
    }
    // Logs
    const logMat = new THREE.MeshLambertMaterial({ color: 0x4a2a1a });
    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), logMat);
    log1.position.set(0, 0.15, 0);
    log1.rotation.z = Math.PI / 2;
    log1.rotation.y = 0.3;
    campfireGroup.add(log1);
    const log2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6), logMat);
    log2.position.set(0, 0.15, 0);
    log2.rotation.z = Math.PI / 2;
    log2.rotation.y = -0.4;
    campfireGroup.add(log2);
    // Fire cubes (animated later)
    const fireMats = [
      new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.9 }),
      new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.8 }),
      new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.7 }),
    ];
    const fireCubes: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const size = 0.1 + Math.random() * 0.15;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        fireMats[Math.floor(Math.random() * fireMats.length)]
      );
      cube.position.set(
        (Math.random() - 0.5) * 0.3,
        0.2 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.3
      );
      campfireGroup.add(cube);
      fireCubes.push(cube);
    }
    campfireGroup.position.set(3, 0, -8);
    scene.add(campfireGroup);
    addCollider(2.35, 3.65, -8.65, -7.35, "campfire");
    // Campfire light
    const campfireLight = new THREE.PointLight(0xff6622, 3, 10, 1.5);
    campfireLight.position.set(3, 1, -8);
    scene.add(campfireLight);
    torchLights.push({ light: campfireLight, baseIntensity: 3 });

    // ====== WAGON (parked near forge) ======
    const wagonWoodMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    const wagonGroup = new THREE.Group();
    // Wagon bed
    const wagonBed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 1.2), wagonWoodMat);
    wagonBed.position.y = 0.5;
    wagonGroup.add(wagonBed);
    // Wagon sides
    const wagonSide1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.08), wagonWoodMat);
    wagonSide1.position.set(0, 0.8, 0.6);
    wagonGroup.add(wagonSide1);
    const wagonSide2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.08), wagonWoodMat);
    wagonSide2.position.set(0, 0.8, -0.6);
    wagonGroup.add(wagonSide2);
    const wagonBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 1.2), wagonWoodMat);
    wagonBack.position.set(-1.25, 0.8, 0);
    wagonGroup.add(wagonBack);
    // Wheels (4)
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
    for (let wx = -0.9; wx <= 0.9; wx += 1.8) {
      for (let wz = -0.65; wz <= 0.65; wz += 1.3) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 8), wheelMat);
        wheel.position.set(wx, 0.3, wz);
        wheel.rotation.x = Math.PI / 2;
        wagonGroup.add(wheel);
      }
    }
    // Cargo in wagon
    const cargo1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), crateMat);
    cargo1.position.set(-0.5, 0.8, 0);
    wagonGroup.add(cargo1);
    const cargo2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), new THREE.MeshLambertMaterial({ color: 0x886644 }));
    cargo2.position.set(0.3, 0.75, 0.2);
    wagonGroup.add(cargo2);
    wagonGroup.position.set(-13, 0, -5);
    wagonGroup.rotation.y = 0.3;
    wagonGroup.castShadow = true;
    scene.add(wagonGroup);
    addCollider(-14.4, -11.6, -6.0, -4.0, "wagon");

    // ====== CLOTHESLINES (between buildings) ======
    const ropeMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
    // Line between tavern area posts
    const clothLine = new THREE.Mesh(new THREE.BoxGeometry(3, 0.03, 0.03), ropeMat);
    clothLine.position.set(-8, 2.8, 11);
    scene.add(clothLine);
    // Hanging clothes
    const clothColors = [0xcc4444, 0x4444cc, 0xcccc44, 0x44cc44, 0xffffff];
    for (let i = 0; i < 4; i++) {
      const cloth = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.4 + Math.random() * 0.2, 0.04),
        new THREE.MeshLambertMaterial({ color: clothColors[Math.floor(Math.random() * clothColors.length)] })
      );
      cloth.position.set(-9 + i * 0.8, 2.45, 11);
      cloth.rotation.z = (Math.random() - 0.5) * 0.15;
      scene.add(cloth);
    }

    // ====== STEPPING STONES (near pond) ======
    const steppingStoneMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
    const steppingStonePositions = [
      [3, -4], [3.5, -4.5], [4, -5], [4.5, -5.5], [3.5, -6],
    ];
    steppingStonePositions.forEach(([sx, sz]) => {
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 0.12, 6),
        steppingStoneMat
      );
      stone.position.set(sx, 0.06, sz);
      scene.add(stone);
    });

    // ====== BUSHES (varied foliage) ======
    const bushMat1 = new THREE.MeshLambertMaterial({ color: 0x2a6a2a });
    const bushMat2 = new THREE.MeshLambertMaterial({ color: 0x3a7a3a });
    const bushMat3 = new THREE.MeshLambertMaterial({ color: 0x2a5a1a });
    const addBush = (x: number, z: number, s: number = 1) => {
      const mat = [bushMat1, bushMat2, bushMat3][Math.floor(Math.random() * 3)];
      const bush = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.5 * s, 0.8 * s), mat);
      bush.position.set(x, 0.25 * s, z);
      bush.castShadow = true;
      scene.add(bush);
      // Second layer
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.3 * s, 0.5 * s), bushMat2);
      top.position.set(x + 0.1, 0.5 * s, z);
      scene.add(top);
    };
    addBush(-6, 5);
    addBush(6, 4, 0.8);
    addBush(-14, -4, 1.2);
    addBush(14, -6);
    addBush(-3, -8, 0.9);
    addBush(10, 5, 0.7);
    addBush(-10, 10);
    addBush(8, -8, 1.1);
    addBush(-16, -10, 0.8);
    addBush(16, -2, 0.9);

    // ====== ROCK CLUSTERS ======
    const rockMat1 = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
    const rockMat2 = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
    const addRockCluster = (x: number, z: number) => {
      for (let i = 0; i < 3; i++) {
        const rSize = 0.2 + Math.random() * 0.3;
        const rock = new THREE.Mesh(
          new THREE.BoxGeometry(rSize, rSize * 0.7, rSize),
          Math.random() > 0.5 ? rockMat1 : rockMat2
        );
        rock.position.set(
          x + (Math.random() - 0.5) * 0.8,
          rSize * 0.35,
          z + (Math.random() - 0.5) * 0.8
        );
        rock.rotation.y = Math.random() * Math.PI;
        rock.rotation.x = (Math.random() - 0.5) * 0.3;
        scene.add(rock);
      }
    };
    addRockCluster(-15, -12);
    addRockCluster(15, -10);
    addRockCluster(-10, 14);
    addRockCluster(12, 14);
    addRockCluster(8, -14);
    addRockCluster(-8, -14);

    // ====== PUDDLES (reflective ground patches) ======
    const puddleMat = new THREE.MeshLambertMaterial({
      color: 0x334466,
      transparent: true,
      opacity: 0.4,
    });
    const addPuddle = (x: number, z: number, s: number = 1) => {
      const puddle = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.5 * s, 0.03, 8), puddleMat);
      puddle.position.set(x, 0.02, z);
      scene.add(puddle);
    };
    addPuddle(-1, 9, 0.8);
    addPuddle(2, -4, 1.2);
    addPuddle(-5, -1, 0.6);
    addPuddle(7, 2, 0.7);

    // ====== GRASS TUFTS (scattered detail) ======
    const grassTuftMat = new THREE.MeshLambertMaterial({ color: 0x4a7a38 });
    const grassTuftMat2 = new THREE.MeshLambertMaterial({ color: 0x3a6a28 });
    for (let i = 0; i < 60; i++) {
      const gx = (Math.random() - 0.5) * 36;
      const gz = (Math.random() - 0.5) * 36;
      // Skip if on path
      if (Math.abs(gx) < 2 && gz > -12 && gz < 18) continue;
      if (Math.abs(gz) < 2 && gx > -12 && gx < 12) continue;
      const tuft = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.15 + Math.random() * 0.1, 0.04),
        Math.random() > 0.5 ? grassTuftMat : grassTuftMat2
      );
      tuft.position.set(gx, 0.1, gz);
      tuft.rotation.y = Math.random() * Math.PI;
      scene.add(tuft);
    }

    // ====== CHIMNEY SMOKE PARTICLES ======
    const smokeCount = 20;
    const smokeGeo = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    const smokeSpeeds = new Float32Array(smokeCount);
    const chimneyPositions = [
      { x: -8 + 5 * 0.3, z: 8 - 5 * 0.2 }, // tavern
      { x: -9 + 4 * 0.3, z: -2 - 4 * 0.2 }, // forge
    ];
    for (let i = 0; i < smokeCount; i++) {
      const cp = chimneyPositions[i % chimneyPositions.length];
      smokePositions[i * 3] = cp.x + (Math.random() - 0.5) * 0.3;
      smokePositions[i * 3 + 1] = 5 + Math.random() * 3;
      smokePositions[i * 3 + 2] = cp.z + (Math.random() - 0.5) * 0.3;
      smokeSpeeds[i] = 0.3 + Math.random() * 0.6;
    }
    smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.4,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    scene.add(new THREE.Points(smokeGeo, smokeMat));

    // ====== NOTICE BOARD: Trophy shelf, certificates ======
    // Small trophy display
    const trophyMat = new THREE.MeshLambertMaterial({ color: 0xccaa33 });
    const trophy = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.4, 6), trophyMat);
    trophy.position.set(9.5, 0.2, 9);
    scene.add(trophy);
    const trophyCup = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.08, 0.15, 6), trophyMat);
    trophyCup.position.set(9.5, 0.45, 9);
    scene.add(trophyCup);
    // Scroll rack
    for (let i = 0; i < 3; i++) {
      const scroll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6),
        new THREE.MeshLambertMaterial({ color: 0xddccaa })
      );
      scroll.position.set(9.8, 0.2, 7.5 + i * 0.3);
      scroll.rotation.z = Math.PI / 2;
      scene.add(scroll);
    }

    // ====== TOWN FOUNTAIN (center feature) ======
    const fountainMat = new THREE.MeshLambertMaterial({ color: 0x6a6a7a });
    // Base pool
    const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.4, 8), fountainMat);
    fountainBase.position.set(-3.5, 0.2, -3.5);
    scene.add(fountainBase);
    addCollider(-5.0, -2.0, -5.0, -2.0, "fountain");
    const fountainWater = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.15, 8),
      new THREE.MeshLambertMaterial({ color: 0x3366cc, transparent: true, opacity: 0.5 })
    );
    fountainWater.position.set(-3.5, 0.35, -3.5);
    scene.add(fountainWater);
    // Center pillar
    const fountainPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.5, 6), fountainMat);
    fountainPillar.position.set(-3.5, 1.1, -3.5);
    scene.add(fountainPillar);
    // Top bowl
    const fountainBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 0.25, 8), fountainMat);
    fountainBowl.position.set(-3.5, 1.9, -3.5);
    scene.add(fountainBowl);
    // Water in top bowl
    const topWater = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.08, 8),
      new THREE.MeshBasicMaterial({ color: 0x5588dd, transparent: true, opacity: 0.6 })
    );
    topWater.position.set(-3.5, 2.0, -3.5);
    scene.add(topWater);
    // Water drop particles
    const dropCount = 12;
    const dropGeo = new THREE.BufferGeometry();
    const dropPos = new Float32Array(dropCount * 3);
    const dropSpeeds = new Float32Array(dropCount);
    for (let i = 0; i < dropCount; i++) {
      const a = (i / dropCount) * Math.PI * 2;
      dropPos[i * 3] = -3.5 + Math.cos(a) * 0.3;
      dropPos[i * 3 + 1] = 1.8 + Math.random();
      dropPos[i * 3 + 2] = -3.5 + Math.sin(a) * 0.3;
      dropSpeeds[i] = 1.2 + Math.random() * 1.2;
    }
    dropGeo.setAttribute("position", new THREE.BufferAttribute(dropPos, 3));
    const dropMat = new THREE.PointsMaterial({
      color: 0x88bbff,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    scene.add(new THREE.Points(dropGeo, dropMat));

    // ====== DOCK / PIER at pond ======
    const dockMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    // Pier planks
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 3), dockMat);
    pier.position.set(7, 0.25, -5);
    scene.add(pier);
    // Pier supports
    for (let pz = -1; pz <= 1; pz++) {
      const support = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), dockMat);
      support.position.set(7, 0.12, -5 + pz * 1.2);
      scene.add(support);
    }
    // Moored boat
    const boatMat = new THREE.MeshLambertMaterial({ color: 0x5c3d2e });
    const boatHull = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 1.2), boatMat);
    boatHull.position.set(7.8, 0.15, -5);
    scene.add(boatHull);
    const boatBow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.3), boatMat);
    boatBow.position.set(7.8, 0.18, -5.7);
    boatBow.rotation.y = 0;
    scene.add(boatBow);
    // Rope from boat to pier
    const rope = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.03), new THREE.MeshLambertMaterial({ color: 0x8a7a5a }));
    rope.position.set(7.4, 0.28, -5.3);
    rope.rotation.y = 0.3;
    scene.add(rope);

    // ====== WOOD PILE (near forge) ======
    const logWoodMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4 - row; col++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 6), logWoodMat);
        log.position.set(-11.5, 0.12 + row * 0.2, -1 + col * 0.22);
        log.rotation.x = Math.PI / 2;
        scene.add(log);
      }
    }

    // ====== MEMORIAL STONES (near exit) ======
    const memorialMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
    for (let i = 0; i < 3; i++) {
      const stone = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.6 + i * 0.1, 0.12),
        memorialMat
      );
      stone.position.set(12 + i * 0.8, 0.3 + i * 0.05, -11.5);
      scene.add(stone);
      // Cross on top of largest
      if (i === 2) {
        const cross = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), memorialMat);
        cross.position.set(12 + i * 0.8, 0.75, -11.5);
        scene.add(cross);
        const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.06), memorialMat);
        crossArm.position.set(12 + i * 0.8, 0.7, -11.5);
        scene.add(crossArm);
      }
    }

    // ====== POTION BOTTLES (near wizard tower) ======
    const potionColors = [0xff3366, 0x33ff66, 0x3366ff, 0xffaa00, 0xaa33ff];
    for (let i = 0; i < 5; i++) {
      const pColor = potionColors[i % potionColors.length];
      // Bottle body
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 0.2, 6),
        new THREE.MeshBasicMaterial({ color: pColor, transparent: true, opacity: 0.7 })
      );
      bottle.position.set(1.5 + i * 0.25, 0.1, -8.5);
      scene.add(bottle);
      // Bottle neck
      const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.04, 0.08, 6),
        new THREE.MeshBasicMaterial({ color: pColor, transparent: true, opacity: 0.7 })
      );
      neck.position.set(1.5 + i * 0.25, 0.24, -8.5);
      scene.add(neck);
    }

    // ====== HANGING WALL LANTERNS ======
    const wallLanternMat = new THREE.MeshLambertMaterial({ color: 0x2a2018 });
    const addWallLantern = (x: number, y: number, z: number) => {
      // Bracket
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.06), wallLanternMat);
      bracket.position.set(x, y, z);
      scene.add(bracket);
      // Lantern body
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.2), wallLanternMat);
      lantern.position.set(x + 0.2, y - 0.15, z);
      scene.add(lantern);
      // Glow
      const glowCube = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 0.12),
        new THREE.MeshBasicMaterial({ color: 0xffcc44 })
      );
      glowCube.position.set(x + 0.2, y - 0.15, z);
      scene.add(glowCube);
      // Light
      const wLight = new THREE.PointLight(0xffaa33, 1, 5, 1.5);
      wLight.position.set(x + 0.2, y - 0.1, z);
      scene.add(wLight);
      torchLights.push({ light: wLight, baseIntensity: 1 });
    };
    // Tavern wall lanterns
    addWallLantern(-5.6, 2.5, 10.5);
    addWallLantern(-10.5, 2.5, 8);
    // Gallery wall lantern
    addWallLantern(11.6, 2, 0);
    // Forge wall lantern
    addWallLantern(-7.1, 2, -2);
    // Gate wall lanterns
    addWallLantern(-2.5, 3, 14);
    addWallLantern(2.5, 3, 14);

    // ====== WEATHER VANE (on tavern roof: h=3.5, roofH=2 => peak at y=5.5) ======
    const tavernPeakY = 3.5 + 2;
    const vaneMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const vanePole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05), vaneMat);
    vanePole.position.set(-8, tavernPeakY + 0.45, 8);
    scene.add(vanePole);
    const vaneArrow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.04), vaneMat);
    vaneArrow.position.set(-8, tavernPeakY + 0.75, 8);
    scene.add(vaneArrow);
    // Arrow tip
    const vaneHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.2, 3),
      new THREE.MeshLambertMaterial({ color: 0xccaa33 })
    );
    vaneHead.position.set(-7.6, tavernPeakY + 0.75, 8);
    vaneHead.rotation.z = -Math.PI / 2;
    scene.add(vaneHead);

    // ====== STONE SLAB CROSSROAD ======
    const slabMat = new THREE.MeshLambertMaterial({ color: 0x7a6a58 });
    // Center crossroad decoration
    for (let sx = -1; sx <= 1; sx++) {
      for (let sz = -1; sz <= 1; sz++) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), slabMat);
        slab.position.set(sx * 0.9, 0.08, sz * 0.9);
        slab.rotation.y = Math.random() * 0.1;
        scene.add(slab);
      }
    }

    // ====== SCARECROW (near gardens) ======
    const scarecrowMat = new THREE.MeshLambertMaterial({ color: 0x5a4020 });
    const scPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2, 0.1), scarecrowMat);
    scPost.position.set(-3, 1, 3.5);
    scene.add(scPost);
    // Arms
    const scArms = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), scarecrowMat);
    scArms.position.set(-3, 1.6, 3.5);
    scene.add(scArms);
    // Head (pumpkin colored)
    const scHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xcc7722 })
    );
    scHead.position.set(-3, 2.15, 3.5);
    scene.add(scHead);
    // Hat
    const scHat = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.3, 4), new THREE.MeshLambertMaterial({ color: 0x2a2018 }));
    scHat.position.set(-3, 2.4, 3.5);
    scHat.rotation.y = Math.PI / 4;
    scene.add(scHat);
    // Hanging cloth scraps
    for (let i = 0; i < 3; i++) {
      const scrap = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.3 + Math.random() * 0.2, 0.03),
        new THREE.MeshLambertMaterial({ color: [0x6a5a3a, 0x8a7a5a, 0x5a4a2a][i] })
      );
      scrap.position.set(-3 + (i - 1) * 0.35, 1.3, 3.5);
      scrap.rotation.z = (Math.random() - 0.5) * 0.3;
      scene.add(scrap);
    }

    // ====== OUTSKIRTS ZONES (Forest, Lakeside, Ruined Hilltop) ======
    // 1. Whispering Forest (West)
    const forestTrailMat = new THREE.MeshLambertMaterial({ color: 0x5c4a38 });
    const westTrail1 = new THREE.Mesh(new THREE.BoxGeometry(9, 0.06, 2.8), forestTrailMat);
    westTrail1.position.set(-22.5, 0.02, 0);
    westTrail1.receiveShadow = true;
    scene.add(westTrail1);
    const westTrail2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 9), forestTrailMat);
    westTrail2.position.set(-26.5, 0.02, 4.5);
    westTrail2.receiveShadow = true;
    scene.add(westTrail2);
    // Hidden clearing meadow ring
    const clearingPatch = new THREE.Mesh(
      new THREE.CylinderGeometry(4.6, 4.8, 0.05, 16),
      new THREE.MeshLambertMaterial({ color: 0x3b6334 })
    );
    clearingPatch.position.set(-28, 0.02, 9);
    clearingPatch.receiveShadow = true;
    scene.add(clearingPatch);
    // Forest trees framing the trail & clearing (leaving trails walkable)
    const forestTrees: [number, number, "oak" | "pine", number][] = [
      [-21, -8, "pine", 4.0], [-26, -11, "oak", 3.4], [-32, -8, "pine", 4.3],
      [-33, -1, "oak", 3.5], [-34, 6, "pine", 4.4], [-33, 13, "oak", 3.6],
      [-26, 15, "pine", 4.1], [-21, 13, "oak", 3.2], [-22, 6, "pine", 3.6],
      [-31, -4, "pine", 3.8],
    ];
    forestTrees.forEach(([tx, tz, kind, th]) => {
      if (kind === "oak") addOak(tx, tz, th);
      else addPine(tx, tz, th);
    });
    // Clearing lantern & mushroom ring
    addLanternPost(-24.5, 8.2);
    addMushroom(-29.5, 7.5, 1.1);
    addMushroom(-30.0, 9.8, 0.9);
    addMushroom(-27.2, 11.4, 1.0);

    // 2. Moonlit Lakeside (East)
    const eastTrail = new THREE.Mesh(new THREE.BoxGeometry(10, 0.06, 2.8), forestTrailMat);
    eastTrail.position.set(22.5, 0.02, 0);
    eastTrail.receiveShadow = true;
    scene.add(eastTrail);
    // Lake water & dark lakebed
    const lakeBed = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.12, 24),
      new THREE.MeshLambertMaterial({ color: 0x162436 })
    );
    lakeBed.position.set(33, -0.02, 0);
    scene.add(lakeBed);
    const lakeWater = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.18, 23), waterMat);
    lakeWater.position.set(33, 0.06, 0);
    scene.add(lakeWater);
    // Lake water colliders (leaving wooden pier x in [25.5, 31.5], z in [-1.4, 1.4] walkable)
    addCollider(27.2, 39, -12.5, -1.5, "lake-north");
    addCollider(27.2, 39, 1.5, 12.5, "lake-south");
    addCollider(31.6, 39, -1.5, 1.5, "lake-deep");
    // Lakeside wooden dock / pier
    const lakeDockDeck = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 0.16, 2.4),
      new THREE.MeshLambertMaterial({ color: 0x624024 })
    );
    lakeDockDeck.position.set(28.5, 0.24, 0);
    lakeDockDeck.receiveShadow = true;
    scene.add(lakeDockDeck);
    for (const px of [26.2, 28.5, 30.8]) {
      for (const pz of [-1.0, 1.0]) {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.6, 0.16),
          new THREE.MeshLambertMaterial({ color: 0x452b16 })
        );
        post.position.set(px, 0.18, pz);
        scene.add(post);
      }
    }
    addLanternPost(26.0, -1.7);
    // Moored rowboat on the lakeside
    const lakeBoatGroup = new THREE.Group();
    const lBoatHull = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.28, 2.1),
      new THREE.MeshLambertMaterial({ color: 0x6a4428 })
    );
    lakeBoatGroup.add(lBoatHull);
    const lBoatBench = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.08, 0.35),
      new THREE.MeshLambertMaterial({ color: 0x825836 })
    );
    lBoatBench.position.y = 0.16;
    lakeBoatGroup.add(lBoatBench);
    lakeBoatGroup.position.set(30.6, 0.18, 2.6);
    lakeBoatGroup.rotation.y = 0.22;
    scene.add(lakeBoatGroup);
    // Lakeside trees & reeds
    addBirch(22, -7, 3.2);
    addOak(22, 8, 3.4);
    addPine(24, -11, 3.6);
    addBirch(24, 11, 2.8);

    // 3. Ruined Hilltop (North)
    // Trail leading north from (0, -16) onto plateau
    const northHillTrail = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 6), forestTrailMat);
    northHillTrail.position.set(0, 0.03, -17);
    scene.add(northHillTrail);
    // Crumbled stone pillars & ruin archways on hilltop (y base = 0.6)
    const ruinStoneMat = new THREE.MeshLambertMaterial({ color: 0x656478 });
    const ruinMossMat = new THREE.MeshLambertMaterial({ color: 0x3b633c });
    const addRuinPillar = (rx: number, rz: number, rh: number) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, rh, 0.9), ruinStoneMat);
      pillar.position.set(rx, 0.6 + rh / 2, rz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      const mossCap = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 0.95), ruinMossMat);
      mossCap.position.set(rx, 0.6 + rh + 0.07, rz);
      scene.add(mossCap);
      addCollider(rx - 0.5, rx + 0.5, rz - 0.5, rz + 0.5, "ruin-pillar");
    };
    addRuinPillar(-4.5, -26.5, 3.2);
    addRuinPillar(-4.5, -30.5, 2.4);
    addRuinPillar(4.5, -30.5, 3.5);
    addRuinPillar(6.5, -25.5, 1.8);
    // Broken lintel bridging west ruin pillars
    const ruinLintel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 4.9), ruinStoneMat);
    ruinLintel.position.set(-4.5, 0.6 + 2.8, -28.5);
    ruinLintel.rotation.x = 0.16;
    scene.add(ruinLintel);
    // Ancient altar stone
    const altar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 1.2), ruinStoneMat);
    altar.position.set(0, 0.6 + 0.425, -31.0);
    altar.castShadow = true;
    scene.add(altar);
    addCollider(-1.1, 1.1, -31.7, -30.3, "ruin-altar");
    // Hilltop Campfire (at 3.2, 0.6, -26.8)
    const hillCampfireGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.24), ruinStoneMat);
      st.position.set(Math.cos(a) * 0.45, 0.09, Math.sin(a) * 0.45);
      st.rotation.y = a;
      hillCampfireGroup.add(st);
    }
    const hillFireMat = new THREE.MeshBasicMaterial({ color: 0xff7722 });
    const hillFlame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.26), hillFireMat);
    hillFlame.position.set(0, 0.26, 0);
    hillCampfireGroup.add(hillFlame);
    hillCampfireGroup.position.set(3.2, 0.6, -26.8);
    scene.add(hillCampfireGroup);
    addCollider(2.6, 3.8, -27.4, -26.2, "hill-campfire");
    const hillCampLight = new THREE.PointLight(0xff7733, 2.8, 12, 1.4);
    hillCampLight.position.set(3.2, 1.6, -26.8);
    scene.add(hillCampLight);
    torchLights.push({ light: hillCampLight, baseIntensity: 2.8 });
    // Hilltop perimeter pines
    addPine(-9, -25, 3.8);
    addPine(9, -25, 3.6);
    addOak(-9, -32, 3.2);
    addPine(9, -32, 3.8);

    // ====== VILLAGERS (8 idle & patrolling townsfolk) ======
    interface VillagerRuntime {
      def: VillagerDef;
      group: THREE.Group;
      legL: THREE.Mesh;
      legR: THREE.Mesh;
      x: number;
      z: number;
      targetIdx: 0 | 1;
      pauseTimer: number;
      walkPhase: number;
    }
    const villagerRuntimes: VillagerRuntime[] = VILLAGERS.map((v) => {
      const vGroup = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.72, 0.32),
        new THREE.MeshLambertMaterial({ color: v.tunicColor })
      );
      body.position.y = 0.86;
      body.castShadow = true;
      vGroup.add(body);
      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.32, 0.32),
        new THREE.MeshLambertMaterial({ color: v.skinColor })
      );
      head.position.y = 1.38;
      vGroup.add(head);
      const hat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.23, 0.14, 6),
        new THREE.MeshLambertMaterial({ color: v.hatColor })
      );
      hat.position.y = 1.58;
      vGroup.add(hat);
      const vLegMat = new THREE.MeshLambertMaterial({ color: 0x352820 });
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.2), vLegMat);
      legL.position.set(-0.11, 0.25, 0);
      vGroup.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.2), vLegMat);
      legR.position.set(0.11, 0.25, 0);
      vGroup.add(legR);

      if (v.isGreeter) {
        const badge = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.12, 0),
          new THREE.MeshBasicMaterial({ color: 0xffdd55 })
        );
        badge.position.set(0, 2.05, 0);
        vGroup.add(badge);
      }

      const startY = getGroundElevation(v.x, v.z);
      vGroup.position.set(v.x, startY, v.z);
      vGroup.rotation.y = v.rotY;
      scene.add(vGroup);
      return {
        def: v,
        group: vGroup,
        legL,
        legR,
        x: v.x,
        z: v.z,
        targetIdx: 1,
        pauseTimer: 0,
        walkPhase: Math.random() * Math.PI * 2,
      };
    });

    // ====== RAIN BARRELS (catchment barrels near buildings) ======
    const rainBarrelMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
    const addRainBarrel = (x: number, z: number) => {
      const rb = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.8, 8), rainBarrelMat);
      rb.position.set(x, 0.4, z);
      rb.castShadow = true;
      scene.add(rb);
      // Water inside
      const rbWater = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8),
        new THREE.MeshLambertMaterial({ color: 0x3355aa, transparent: true, opacity: 0.5 })
      );
      rbWater.position.set(x, 0.75, z);
      scene.add(rbWater);
    };
    addRainBarrel(-10.8, 10);
    addRainBarrel(11.8, -1.5);
    addRainBarrel(-11.2, -4.5);
    addRainBarrel(9.5, -12);

    // ====== PLAYER (ROGUE) ======
    const playerGroup = new THREE.Group();

    // Subtle ground highlight ring so player silhouette pops against dark cobblestones
    const playerAuraMat = new THREE.MeshBasicMaterial({
      color: 0xf0c248,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    });
    const playerAura = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.58, 16), playerAuraMat);
    playerAura.rotation.x = -Math.PI / 2;
    playerAura.position.y = 0.09;
    playerGroup.add(playerAura);

    // Legs (dark leather boots)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x3a2418 });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.3), legMat);
    legL.position.set(-0.15, 0.25, 0);
    playerGroup.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.3), legMat);
    legR.position.set(0.15, 0.25, 0);
    playerGroup.add(legR);

    // Body (slate-navy leather tunic for crisp silhouette contrast)
    const playerBodyMat = new THREE.MeshLambertMaterial({ color: 0x3a4864 });
    const playerBody = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.8, 0.42), playerBodyMat);
    playerBody.position.y = 0.8;
    playerGroup.add(playerBody);

    // Warm crimson-gold adventurer scarf/collar so character reads sharply at all zoom levels
    const scarfMat = new THREE.MeshLambertMaterial({ color: 0xd9483b });
    const scarf = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.48), scarfMat);
    scarf.position.y = 1.17;
    playerGroup.add(scarf);

    // Belt
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x5c3c24 });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.46), beltMat);
    belt.position.y = 0.55;
    playerGroup.add(belt);
    // Belt buckle
    const buckleMat = new THREE.MeshLambertMaterial({ color: 0xf0c248 });
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.04), buckleMat);
    buckle.position.set(0, 0.55, 0.24);
    playerGroup.add(buckle);

    // Head
    const playerHeadMat = new THREE.MeshLambertMaterial({ color: 0xffd59e });
    const playerHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), playerHeadMat);
    playerHead.position.y = 1.45;
    playerGroup.add(playerHead);

    // Hood (rogue hood - slate cloak with gold trim)
    const cloakHoodMat = new THREE.MeshLambertMaterial({ color: 0x283044 });
    // Hood top
    const hoodTop = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.62), cloakHoodMat);
    hoodTop.position.y = 1.8;
    playerGroup.add(hoodTop);
    // Hood sides
    const hoodBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.12), cloakHoodMat);
    hoodBack.position.set(0, 1.5, -0.3);
    playerGroup.add(hoodBack);
    // Hood front edge (gold trim)
    const hoodFront = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.06), buckleMat);
    hoodFront.position.set(0, 1.69, 0.3);
    playerGroup.add(hoodFront);

    // Cape (flowing behind, crimson-lined dark cloak)
    const capeMat = new THREE.MeshLambertMaterial({ color: 0x2b354d });
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.9, 0.08), capeMat);
    cape.position.set(0, 0.75, -0.26);
    playerGroup.add(cape);

    // Dagger (right hand) - blade + handle
    const bladeMat = new THREE.MeshLambertMaterial({ color: 0xe6e8f4 });
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x5c3c24 });
    // Right dagger
    const rBlade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.04), bladeMat);
    rBlade.position.set(0.42, 0.75, 0.1);
    rBlade.rotation.z = -0.3;
    playerGroup.add(rBlade);
    const rHandle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.06), handleMat);
    rHandle.position.set(0.4, 0.55, 0.1);
    rHandle.rotation.z = -0.3;
    playerGroup.add(rHandle);
    // Left dagger
    const lBlade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.04), bladeMat);
    lBlade.position.set(-0.42, 0.75, 0.1);
    lBlade.rotation.z = 0.3;
    playerGroup.add(lBlade);
    const lHandle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.06), handleMat);
    lHandle.position.set(-0.4, 0.55, 0.1);
    lHandle.rotation.z = 0.3;
    playerGroup.add(lHandle);

    // Eyes (small glowing points under the hood)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x7cffb2 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.02), eyeMat);
    eyeL.position.set(-0.1, 1.5, 0.26);
    playerGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.02), eyeMat);
    eyeR.position.set(0.1, 1.5, 0.26);
    playerGroup.add(eyeR);

    // Personal subtle rim light so player always remains legible in dark shadows
    const playerRimLight = new THREE.PointLight(0xdce6ff, 1.35, 5.5, 1.4);
    playerRimLight.position.set(0.4, 2.3, 0.5);
    playerGroup.add(playerRimLight);

    playerGroup.position.copy(playerPosRef.current);
    playerGroup.castShadow = true;
    scene.add(playerGroup);

    // ====== COMPANION FAMILIAR (Arcane Pixel Owl) ======
    const familiarGroup = new THREE.Group();
    const familiarBodyMat = new THREE.MeshLambertMaterial({ color: 0x6b58a6 });
    const familiarWingMat = new THREE.MeshLambertMaterial({ color: 0x8b76c8 });
    const familiarEyeMat = new THREE.MeshBasicMaterial({ color: 0xffd15c });
    const familiarBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.28), familiarBodyMat);
    familiarGroup.add(familiarBody);
    const familiarBelly = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.04), new THREE.MeshLambertMaterial({ color: 0xe8dfc8 }));
    familiarBelly.position.set(0, -0.02, 0.14);
    familiarGroup.add(familiarBelly);
    const familiarEyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), familiarEyeMat);
    familiarEyeL.position.set(-0.07, 0.07, 0.14);
    familiarGroup.add(familiarEyeL);
    const familiarEyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), familiarEyeMat);
    familiarEyeR.position.set(0.07, 0.07, 0.14);
    familiarGroup.add(familiarEyeR);
    const familiarBeak = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.06), familiarEyeMat);
    familiarBeak.position.set(0, 0.02, 0.16);
    familiarGroup.add(familiarBeak);
    const famWingL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.18), familiarWingMat);
    famWingL.position.set(-0.24, 0.02, 0);
    familiarGroup.add(famWingL);
    const famWingR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.18), familiarWingMat);
    famWingR.position.set(0.24, 0.02, 0);
    familiarGroup.add(famWingR);
    familiarGroup.position.set(playerPosRef.current.x + 0.9, 1.5, playerPosRef.current.z + 0.9);
    scene.add(familiarGroup);

    // ====== 5 HIDDEN SECRETS (world pickups) ======
    const secretItems: {
      def: SecretFindDef;
      group: THREE.Group;
      accent: THREE.Mesh;
      ring: THREE.Mesh;
      ringMat: THREE.MeshBasicMaterial;
    }[] = [];
    const secretRingGeo = new THREE.RingGeometry(0.45, 0.58, 12);
    for (const def of SECRET_FINDS) {
      const sGroup = new THREE.Group();
      sGroup.position.set(def.x, def.y, def.z);
      let accent: THREE.Mesh;
      if (def.id === "tavern-coin") {
        accent = new THREE.Mesh(
          new THREE.CylinderGeometry(0.26, 0.26, 0.08, 10),
          new THREE.MeshBasicMaterial({ color: 0xf7c948 })
        );
        accent.rotation.x = Math.PI / 2;
        sGroup.add(accent);
      } else if (def.id === "stray-cat") {
        const catBlack = new THREE.MeshLambertMaterial({ color: 0x1d1d26 });
        const catWhite = new THREE.MeshLambertMaterial({ color: 0xf0ece0 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.62), catBlack);
        body.position.y = 0.22;
        sGroup.add(body);
        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.1), catWhite);
        chest.position.set(0, 0.2, 0.29);
        sGroup.add(chest);
        const catHead = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.28), catBlack);
        catHead.position.set(0, 0.44, 0.2);
        sGroup.add(catHead);
        const earGeo = new THREE.BoxGeometry(0.08, 0.1, 0.08);
        const earL = new THREE.Mesh(earGeo, catBlack);
        earL.position.set(-0.1, 0.6, 0.2);
        sGroup.add(earL);
        const earR = new THREE.Mesh(earGeo, catBlack);
        earR.position.set(0.1, 0.6, 0.2);
        sGroup.add(earR);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), catWhite);
        tail.position.set(0, 0.34, -0.32);
        tail.rotation.x = -0.5;
        sGroup.add(tail);
        accent = tail;
        const catEyes = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.05, 0.03),
          new THREE.MeshBasicMaterial({ color: 0x62f59a })
        );
        catEyes.position.set(0, 0.45, 0.34);
        sGroup.add(catEyes);
      } else if (def.id === "forest-shard") {
        accent = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.32, 0),
          new THREE.MeshBasicMaterial({ color: 0x5ae2ff })
        );
        accent.position.y = 0.2;
        sGroup.add(accent);
      } else if (def.id === "lakeside-bottle") {
        accent = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.2, 0.48, 8),
          new THREE.MeshBasicMaterial({ color: 0x5be3b8 })
        );
        accent.rotation.z = 0.45;
        accent.position.y = 0.15;
        sGroup.add(accent);
      } else {
        // Ruins treasure chest
        const chestBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 0.45, 0.55),
          new THREE.MeshLambertMaterial({ color: 0x6b4122 })
        );
        chestBase.position.y = 0.22;
        sGroup.add(chestBase);
        accent = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.16, 0.58),
          new THREE.MeshBasicMaterial({ color: 0xf4c542 })
        );
        accent.position.y = 0.38;
        sGroup.add(accent);
      }
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffdc66,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const ring = new THREE.Mesh(secretRingGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      sGroup.add(ring);
      scene.add(sGroup);
      secretItems.push({ def, group: sGroup, accent, ring, ringMat });
    }

    // ====== WALK-IN INTERIORS (Tavern & Wizard's Tower Cutaway Rooms) ======
    const tavernInteriorColliders: ColliderBox[] = [];
    const wizardInteriorColliders: ColliderBox[] = [];

    const buildInteriorShell = (
      cx: number,
      cz: number,
      floorColor: number,
      wallColor: number,
      trimColor: number,
      rugColor: number
    ) => {
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(9.2, 0.3, 7.8),
        new THREE.MeshLambertMaterial({ color: floorColor })
      );
      floor.position.set(cx, -0.15, cz);
      floor.receiveShadow = true;
      scene.add(floor);

      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(9.2, 4.2, 0.35),
        new THREE.MeshLambertMaterial({ color: wallColor })
      );
      backWall.position.set(cx, 2.1, cz - 3.9);
      scene.add(backWall);

      const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 4.2, 7.8),
        new THREE.MeshLambertMaterial({ color: trimColor })
      );
      leftWall.position.set(cx - 4.6, 2.1, cz);
      scene.add(leftWall);

      const rug = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.04, 3.6),
        new THREE.MeshLambertMaterial({ color: rugColor })
      );
      rug.position.set(cx, 0.02, cz + 0.6);
      scene.add(rug);

      const exitMat = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.06, 1.0),
        new THREE.MeshBasicMaterial({ color: 0xf0c248 })
      );
      exitMat.position.set(cx, 0.03, cz + 3.2);
      scene.add(exitMat);
    };

    // --- 1) The Tavern Interior centered at (0, 0, 72) ---
    buildInteriorShell(0, 72, 0x5c3c24, 0x6f4b2f, 0x4b311d, 0x7b2d2d);
    const barCounter = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.1, 1.0),
      new THREE.MeshLambertMaterial({ color: 0x3b2414 })
    );
    barCounter.position.set(2.2, 0.55, 69.8);
    scene.add(barCounter);
    tavernInteriorColliders.push({ minX: 0.4, maxX: 4.0, minZ: 69.2, maxZ: 70.4, label: "tavern-bar" });

    const dossierDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.9, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x7a5230 })
    );
    dossierDesk.position.set(-2.0, 0.45, 70.1);
    scene.add(dossierDesk);
    const dossierBook = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.14, 0.55),
      new THREE.MeshBasicMaterial({ color: 0xf4c855 })
    );
    dossierBook.position.set(-2.0, 0.96, 70.1);
    scene.add(dossierBook);
    tavernInteriorColliders.push({ minX: -3.0, maxX: -1.0, minZ: 69.5, maxZ: 70.7, label: "tavern-desk" });

    const tavernHearth = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.4, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x4a4552 })
    );
    tavernHearth.position.set(-4.1, 1.2, 72.2);
    scene.add(tavernHearth);
    const hearthEmbers = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.4, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff7722 })
    );
    hearthEmbers.position.set(-3.75, 0.3, 72.2);
    scene.add(hearthEmbers);
    tavernInteriorColliders.push({ minX: -4.4, maxX: -3.4, minZ: 71.7, maxZ: 72.7, label: "tavern-hearth" });

    // --- 2) Wizard's Tower Interior centered at (32, 0, 72) ---
    buildInteriorShell(32, 72, 0x2b2844, 0x3f3660, 0x2e2748, 0x3c527a);
    const orbPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.7, 1.1, 8),
      new THREE.MeshLambertMaterial({ color: 0x4b446e })
    );
    orbPedestal.position.set(32, 0.55, 70.2);
    scene.add(orbPedestal);
    const interiorScryOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45, 0),
      new THREE.MeshBasicMaterial({ color: 0xbb77ff })
    );
    interiorScryOrb.position.set(32, 1.65, 70.2);
    scene.add(interiorScryOrb);
    wizardInteriorColliders.push({ minX: 31.3, maxX: 32.7, minZ: 69.5, maxZ: 70.9, label: "wizard-pedestal" });

    const bookshelf = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.4, 0.75),
      new THREE.MeshLambertMaterial({ color: 0x513826 })
    );
    bookshelf.position.set(34.6, 1.2, 68.7);
    scene.add(bookshelf);
    const tomeAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.35, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x5ae2ff })
    );
    tomeAccent.position.set(34.6, 1.5, 69.1);
    scene.add(tomeAccent);
    wizardInteriorColliders.push({ minX: 33.2, maxX: 36.0, minZ: 68.4, maxZ: 69.4, label: "wizard-bookshelf" });

    // ====== GENTLE ATMOSPHERIC RAIN (lightweight single Points pass) ======
    const rainCount = 96;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 34;
      rainPositions[i * 3 + 1] = Math.random() * 14 + 1;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 34;
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x8cc8ff,
      size: 0.22,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    rainPoints.visible = false;
    scene.add(rainPoints);

    // ====== LIGHTING (high-contrast moonlit night mood) ======
    // Ambient — low enough to keep crisp face/shadow contrast while preserving night readability
    const ambient = new THREE.AmbientLight(0x5a6cb2, 0.95);
    scene.add(ambient);

    // Moonlight — crisp cool key light separating roof planes from facades
    const moon = new THREE.DirectionalLight(0xcbe0ff, 1.75);
    moon.position.set(-12, 24, 10);
    moon.castShadow = true;
    moon.shadow.mapSize.width = 2048;
    moon.shadow.mapSize.height = 2048;
    moon.shadow.camera.near = 0.5;
    moon.shadow.camera.far = 65;
    moon.shadow.camera.left = -28;
    moon.shadow.camera.right = 28;
    moon.shadow.camera.top = 28;
    moon.shadow.camera.bottom = -28;
    scene.add(moon);

    // Secondary fill light from opposite side
    const fill = new THREE.DirectionalLight(0x8878c8, 0.6);
    fill.position.set(12, 12, 10);
    scene.add(fill);

    // Torch lights (at buildings with windows)

    BUILDINGS.forEach((b) => {
      if (b.hasWindows || b.id === "questboard") {
        const light = new THREE.PointLight(0xffaa44, 3, 16, 1.2);
        light.position.set(b.x, b.h * 0.7, b.z + b.d / 2 + 1);
        scene.add(light);
        torchLights.push({ light, baseIntensity: 3 });
      }
    });

    // Forge fire glow
    const forgeFire = new THREE.PointLight(0xff6622, 4, 12, 1.2);
    forgeFire.position.set(-9, 2, -2);
    scene.add(forgeFire);
    torchLights.push({ light: forgeFire, baseIntensity: 4 });

    // ====== PARTICLES (fireflies across town & forest clearing) ======
    const particleCount = 85;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      if (i >= 60) {
        // Extra golden fireflies clustering in the Whispering Forest clearing
        pPositions[i * 3] = -28 + (Math.random() - 0.5) * 12;
        pPositions[i * 3 + 1] = Math.random() * 3.2 + 0.5;
        pPositions[i * 3 + 2] = 7 + (Math.random() - 0.5) * 14;
      } else {
        pPositions[i * 3] = (Math.random() - 0.5) * 44;
        pPositions[i * 3 + 1] = Math.random() * 4 + 0.5;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 44;
      }
      pSpeeds[i] = Math.random() * 0.5 + 0.2;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xffcc44,
      size: 0.25,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    scene.add(new THREE.Points(particleGeo, particleMat));

    // ====== STARS ======
    const starCount = 200;
    const starGeo = new THREE.BufferGeometry();
    const sPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.35;
      const r = 35;
      sPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      sPositions[i * 3 + 1] = r * Math.cos(phi);
      sPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(sPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ====== INPUT ======
    const GAME_KEYS = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "e"]);
    const isInteractiveElement = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName) || target.isContentEditable);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (GAME_KEYS.has(key) && !modalOpenRef.current && !isInteractiveElement(e.target)) {
        e.preventDefault();
      }
      if (modalOpenRef.current) return;
      keysRef.current.add(key);
      if ((key === "e" || key === " ") && !e.repeat && !isInteractiveElement(e.target)) {
        handleInteract();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    const clearHeldInputs = () => {
      keysRef.current.clear();
      setMobileDir(0, 0);
    };
    const onVisibilityChange = () => {
      if (document.hidden) clearHeldInputs();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearHeldInputs);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // ====== RESIZE ======
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const f = computeOrthoFrustum(w, h, 12);
      camera.left = f.left;
      camera.right = f.right;
      camera.top = f.top;
      camera.bottom = f.bottom;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderTarget.setSize(Math.floor(w / PIXEL_SCALE), Math.floor(h / PIXEL_SCALE));
    };
    window.addEventListener("resize", onResize);

    // ====== ANIMATION (frame-rate independent with clamped delta) ======
    let lastTime = performance.now();
    let elapsed = 0;
    let walkCycle = 0;
    let lastPosEmitTime = 0;
    let lastTimeEmitTime = 0;
    let lastEmittedX = playerPosRef.current.x;
    let lastEmittedZ = playerPosRef.current.z;
    onPlayerPosChangeRef.current?.({ x: lastEmittedX, z: lastEmittedZ });

    const targetFogColor = new THREE.Color(ZONE_METADATA.town.fogColorHex);
    const cycleTintColor = new THREE.Color(0x161932);
    const lanternDayColor = new THREE.Color(0x555c6e);
    const lanternNightColor = new THREE.Color(0xffcc44);
    let lastCloakState = cloakEquippedRef.current;
    let familiarPosX = familiarGroup.position.x;
    let familiarPosZ = familiarGroup.position.z;

    const snapCameraAndFamiliar = () => {
      const px = playerPosRef.current.x;
      const pz = playerPosRef.current.z;
      const elev = currentInteriorRef.current ? 0 : getGroundElevation(px, pz);
      playerGroup.position.set(px, elev, pz);
      familiarPosX = px + 0.9;
      familiarPosZ = pz + 0.9;
      familiarGroup.position.set(familiarPosX, elev + 1.45, familiarPosZ);
      camLookTarget.set(px, 0, pz);
      camera.position.set(px + followOffset.x, followOffset.y, pz + followOffset.z);
      camera.lookAt(camLookTarget);
      sweepDone = true;
    };

    enterInteriorFnRef.current = (id: InteriorId) => {
      savedOutdoorPosRef.current = { x: playerPosRef.current.x, z: playerPosRef.current.z };
      currentInteriorRef.current = id;
      const roomCenterX = id === "tavern" ? 0 : 32;
      playerPosRef.current.set(roomCenterX, 0, 74.2);
      playerGroup.rotation.y = Math.PI;
      nearBuildingRef.current = null;
      nearVillagerRef.current = null;
      nearSecretRef.current = null;
      onNearBuilding(null);
      onNearVillagerRef.current?.(null);
      onNearSecretRef.current?.(null);
      snapCameraAndFamiliar();
      onInteriorChangeRef.current?.(id);
    };

    exitRequestFnRef.current = () => {
      const prevId = currentInteriorRef.current;
      currentInteriorRef.current = null;
      nearInteriorActionRef.current = null;
      onNearInteriorActionRef.current?.(null);
      const fallback =
        prevId === "tavern"
          ? { x: -8, z: 11.4 }
          : prevId === "wizard"
          ? { x: 0, z: -6.8 }
          : savedOutdoorPosRef.current;
      playerPosRef.current.set(fallback.x, 0, fallback.z);
      playerGroup.rotation.y = 0;
      snapCameraAndFamiliar();
      onInteriorChangeRef.current?.(null);
    };

    const animate = (now: number) => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (pausedRef.current) {
        lastTime = now;
        return;
      }
      const dt = clampDeltaSec(now - lastTime);
      lastTime = now;
      elapsed += dt;
      const keys = keysRef.current;
      const insideRoom = currentInteriorRef.current;

      // ---- Sync Royal Cloak appearance if toggled ----
      if (cloakEquippedRef.current !== lastCloakState) {
        lastCloakState = cloakEquippedRef.current;
        if (lastCloakState) {
          cloakHoodMat.color.setHex(0x1e6b52);
          capeMat.color.setHex(0x1a5e48);
          scarfMat.color.setHex(0xf5c842);
          playerAuraMat.color.setHex(0x55ee99);
          playerAuraMat.opacity = 0.55;
          familiarBodyMat.color.setHex(0x287654);
          familiarWingMat.color.setHex(0xf2c94c);
        } else {
          cloakHoodMat.color.setHex(0x283044);
          capeMat.color.setHex(0x2b354d);
          scarfMat.color.setHex(0xd9483b);
          playerAuraMat.color.setHex(0xf0c248);
          playerAuraMat.opacity = 0.42;
          familiarBodyMat.color.setHex(0x6b58a6);
          familiarWingMat.color.setHex(0x8b76c8);
        }
      }

      // ---- Update patrolling villagers ----
      const dynamicNpcColliders: ColliderBox[] = [];
      for (const vr of villagerRuntimes) {
        if (!insideRoom && vr.def.patrolTo) {
          const dest = vr.targetIdx === 1 ? vr.def.patrolTo : { x: vr.def.x, z: vr.def.z };
          const toX = dest.x - vr.x;
          const toZ = dest.z - vr.z;
          const distToDest = Math.hypot(toX, toZ);
          const distToPlayer = Math.hypot(
            playerPosRef.current.x - vr.x,
            playerPosRef.current.z - vr.z
          );
          if (vr.pauseTimer > 0) {
            vr.pauseTimer -= dt;
            vr.legL.rotation.x *= Math.exp(-10 * dt);
            vr.legR.rotation.x *= Math.exp(-10 * dt);
          } else if (distToPlayer < 1.35) {
            // Pause and face player politely when nearby
            vr.group.rotation.y = Math.atan2(
              playerPosRef.current.x - vr.x,
              playerPosRef.current.z - vr.z
            );
            vr.legL.rotation.x *= Math.exp(-10 * dt);
            vr.legR.rotation.x *= Math.exp(-10 * dt);
          } else if (distToDest < 0.12) {
            vr.targetIdx = vr.targetIdx === 1 ? 0 : 1;
            vr.pauseTimer = 1.4;
          } else {
            const spd = (vr.def.speed || 1.2) * dt;
            const nx = (toX / distToDest) * spd;
            const nz = (toZ / distToDest) * spd;
            vr.x += nx;
            vr.z += nz;
            vr.group.rotation.y = Math.atan2(nx, nz);
            vr.walkPhase += dt * 7.5;
            vr.legL.rotation.x = Math.sin(vr.walkPhase) * 0.4;
            vr.legR.rotation.x = -Math.sin(vr.walkPhase) * 0.4;
          }
        }
        const vy = getGroundElevation(vr.x, vr.z);
        vr.group.position.set(vr.x, vy, vr.z);
        dynamicNpcColliders.push({
          minX: vr.x - 0.35,
          maxX: vr.x + 0.35,
          minZ: vr.z - 0.35,
          maxZ: vr.z + 0.35,
          label: vr.def.id,
        });
      }

      // ---- Player movement ----
      if (!modalOpenRef.current) {
        let dx = 0;
        let dz = 0;
        // Isometric movement: map WASD to isometric axes
        if (keys.has("w") || keys.has("arrowup")) { dx -= 1; dz -= 1; }
        if (keys.has("s") || keys.has("arrowdown")) { dx += 1; dz += 1; }
        if (keys.has("a") || keys.has("arrowleft")) { dx -= 1; dz += 1; }
        if (keys.has("d") || keys.has("arrowright")) { dx += 1; dz -= 1; }

        // Mobile d-pad / thumbstick input (reads directly from shared module)
        if (mobileInput.dx !== 0 || mobileInput.dz !== 0) {
          dx += mobileInput.dx + mobileInput.dz;
          dz += mobileInput.dz - mobileInput.dx;
        }

        // Mobile interact button
        if (consumeMobileInteract()) {
          handleInteract();
        }

        const activeColliders =
          insideRoom === "tavern"
            ? tavernInteriorColliders
            : insideRoom === "wizard"
            ? wizardInteriorColliders
            : colliders.concat(dynamicNpcColliders);
        const activeBounds =
          insideRoom === "tavern"
            ? TAVERN_INTERIOR_BOUNDS
            : insideRoom === "wizard"
            ? WIZARD_INTERIOR_BOUNDS
            : EXPANDED_WORLD_BOUNDS;

        const step = resolvePlayerStep(
          { x: playerPosRef.current.x, z: playerPosRef.current.z },
          dx,
          dz,
          dt,
          activeColliders,
          undefined,
          undefined,
          activeBounds
        );

        if (step.moved) {
          sweepDone = true;
          playerPosRef.current.x = step.x;
          playerPosRef.current.z = step.z;

          // Face direction
          playerGroup.rotation.y = Math.atan2(step.moveDx, step.moveDz);

          // Walk animation — full body (frame-rate independent)
          walkCycle += WALK_CYCLE_RAD_PER_SEC * dt;
          const swing = Math.sin(walkCycle);
          const swingAlt = Math.sin(walkCycle + Math.PI);

          // Legs swing forward/back
          legL.rotation.x = swing * 0.5;
          legL.position.y = 0.25 + Math.abs(swing) * 0.05;
          legL.position.z = swing * 0.12;
          legR.rotation.x = swingAlt * 0.5;
          legR.position.y = 0.25 + Math.abs(swingAlt) * 0.05;
          legR.position.z = swingAlt * 0.12;

          // Arms/daggers swing opposite to legs
          rBlade.rotation.x = swingAlt * 0.4;
          rBlade.position.z = 0.1 + swingAlt * 0.1;
          rHandle.rotation.x = swingAlt * 0.4;
          rHandle.position.z = 0.1 + swingAlt * 0.1;
          lBlade.rotation.x = swing * 0.4;
          lBlade.position.z = 0.1 + swing * 0.1;
          lHandle.rotation.x = swing * 0.4;
          lHandle.position.z = 0.1 + swing * 0.1;

          // Body bob
          const bobOffset = Math.abs(Math.sin(walkCycle * 2)) * 0.04;
          playerBody.position.y = 0.8 + bobOffset;
          scarf.position.y = 1.17 + bobOffset;
          playerHead.position.y = 1.45 + bobOffset;
          hoodTop.position.y = 1.8 + bobOffset;

          // Cape flutter
          cape.rotation.x = swing * 0.15;
          cape.position.z = -0.25 - Math.abs(swing) * 0.05;
        } else {
          // Idle — smoothly return to default (frame-rate independent exponential decay)
          const idleDecay = Math.exp(-13.4 * dt);
          const capeDecay = Math.exp(-9.75 * dt);
          legL.rotation.x *= idleDecay;
          legR.rotation.x *= idleDecay;
          legL.position.y = 0.25;
          legR.position.y = 0.25;
          legL.position.z *= idleDecay;
          legR.position.z *= idleDecay;
          rBlade.rotation.x *= idleDecay;
          rHandle.rotation.x *= idleDecay;
          lBlade.rotation.x *= idleDecay;
          lHandle.rotation.x *= idleDecay;
          playerBody.position.y = 0.8;
          scarf.position.y = 1.17;
          playerHead.position.y = 1.45;
          hoodTop.position.y = 1.8;
          cape.rotation.x *= capeDecay;
          cape.position.z = -0.26;
        }

        const playerElev = insideRoom ? 0 : getGroundElevation(playerPosRef.current.x, playerPosRef.current.z);
        playerGroup.position.set(
          playerPosRef.current.x,
          playerElev,
          playerPosRef.current.z
        );

        // Zone check (only outdoors so entering rooms preserves outskirt map context cleanly)
        if (!insideRoom) {
          const detectedZone = detectPlayerZone(playerPosRef.current.x, playerPosRef.current.z);
          if (detectedZone !== currentZoneRef.current) {
            currentZoneRef.current = detectedZone;
            onZoneChangeRef.current?.(detectedZone);
          }

          if (
            now - lastPosEmitTime > 110 &&
            (Math.abs(playerPosRef.current.x - lastEmittedX) > 0.15 ||
              Math.abs(playerPosRef.current.z - lastEmittedZ) > 0.15)
          ) {
            lastPosEmitTime = now;
            lastEmittedX = playerPosRef.current.x;
            lastEmittedZ = playerPosRef.current.z;
            onPlayerPosChangeRef.current?.({ x: lastEmittedX, z: lastEmittedZ });
          }
        }
      } else {
        sweepDone = true;
      }

      // ---- Day/Night cycle & optional gentle weather ----
      const dayNight = computeDayNightState(elapsed / DAY_CYCLE_DURATION_SEC, nightPinnedRef.current);
      const isRaining = !insideRoom && !prefersReducedMotion && (elapsed % 60) > 36;
      ambient.intensity = insideRoom ? 1.35 : dayNight.ambientIntensity;
      moon.intensity = insideRoom ? 1.65 : dayNight.dirIntensity;
      moon.color.setHex(insideRoom ? 0xffe4b8 : dayNight.dirColorHex);
      moon.position.y = insideRoom ? 28 : dayNight.sunHeight;
      lanternGlassMat.color.copy(lanternDayColor).lerp(lanternNightColor, dayNight.lanternFactor);

      if (insideRoom) {
        targetFogColor.setHex(insideRoom === "tavern" ? 0x19121a : 0x141226);
      } else {
        const zoneHex = ZONE_METADATA[currentZoneRef.current].fogColorHex;
        targetFogColor.setHex(zoneHex);
        cycleTintColor.setHex(dayNight.skyTintHex);
        targetFogColor.lerp(cycleTintColor, 0.55);
      }

      if (now - lastTimeEmitTime > 950) {
        lastTimeEmitTime = now;
        onTimeInfoChangeRef.current?.({
          label: dayNight.label,
          emoji: dayNight.emoji,
          raining: isRaining,
        });
      }

      // Smoothly transition fog & background on zone/time transitions
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.lerp(targetFogColor, expDampingAlpha(3.2, dt));
      }
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(targetFogColor, expDampingAlpha(3.2, dt));
      }

      // Update gentle rain overlay around player
      rainPoints.visible = isRaining;
      if (isRaining) {
        const rp = rainGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < rainCount; i++) {
          rp[i * 3 + 1] -= 14 * dt;
          if (rp[i * 3 + 1] < 0) {
            rp[i * 3] = playerPosRef.current.x + (Math.random() - 0.5) * 32;
            rp[i * 3 + 1] = 13 + Math.random() * 4;
            rp[i * 3 + 2] = playerPosRef.current.z + (Math.random() - 0.5) * 32;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // ---- Companion Familiar trailing & flapping ----
      const yaw = playerGroup.rotation.y;
      const famTargetX = playerPosRef.current.x - Math.sin(yaw) * 1.05 + Math.cos(yaw) * 0.65;
      const famTargetZ = playerPosRef.current.z - Math.cos(yaw) * 1.05 - Math.sin(yaw) * 0.65;
      const famAlpha = expDampingAlpha(4.8, dt);
      familiarPosX += (famTargetX - familiarPosX) * famAlpha;
      familiarPosZ += (famTargetZ - familiarPosZ) * famAlpha;
      const famElev = insideRoom ? 0 : getGroundElevation(familiarPosX, familiarPosZ);
      familiarGroup.position.set(
        familiarPosX,
        famElev + 1.48 + Math.sin(elapsed * 3.4) * 0.12,
        familiarPosZ
      );
      familiarGroup.rotation.y = yaw;
      const flap = Math.sin(elapsed * 9) * 0.42;
      famWingL.rotation.z = flap;
      famWingR.rotation.z = -flap;

      // ---- Secret collectibles animation ----
      for (const item of secretItems) {
        const collected = foundSecretsRef.current.has(item.def.id);
        if (item.def.id === "stray-cat") {
          item.accent.rotation.x = -0.5 + Math.sin(elapsed * (collected ? 5 : 2.5)) * 0.25;
          item.ringMat.opacity = collected ? 0.12 : 0.35 + Math.sin(elapsed * 3) * 0.15;
          item.ringMat.color.setHex(collected ? 0x55dd88 : 0xffdc66);
        } else {
          item.group.visible = !collected;
          if (!collected) {
            item.accent.rotation.y = elapsed * 1.8;
            item.accent.position.y = 0.22 + Math.sin(elapsed * 2.6) * 0.08;
            item.ringMat.opacity = 0.3 + Math.sin(elapsed * 3) * 0.18;
          }
        }
      }

      // ---- Interior orb / flame flicker ----
      interiorScryOrb.rotation.y = elapsed * 1.4;
      interiorScryOrb.position.y = 1.65 + Math.sin(elapsed * 2.4) * 0.12;
      hearthEmbers.scale.setScalar(0.9 + Math.sin(elapsed * 6) * 0.12);

      // Gently bob lakeside rowboat & hilltop campfire flame
      lakeBoatGroup.position.y = 0.18 + Math.sin(elapsed * 1.8) * 0.04;
      lakeBoatGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.04;
      hillFlame.scale.setScalar(0.85 + Math.sin(elapsed * 7) * 0.2);
      hillFlame.rotation.y = elapsed * 2.5;

      // ---- Opening camera sweep or smooth player follow ----
      if (!sweepDone) {
        sweepElapsed += dt;
        const rawT = Math.min(sweepElapsed / SWEEP_DURATION, 1);
        const eased = 1 - Math.pow(1 - rawT, 3);
        camLookTarget.lerpVectors(sweepStartTarget, playerPosRef.current, eased);
        camLookTarget.y = 0;
        const offX = THREE.MathUtils.lerp(sweepStartOffset.x, followOffset.x, eased);
        const offY = THREE.MathUtils.lerp(sweepStartOffset.y, followOffset.y, eased);
        const offZ = THREE.MathUtils.lerp(sweepStartOffset.z, followOffset.z, eased);
        camera.position.set(camLookTarget.x + offX, offY, camLookTarget.z + offZ);
        camera.lookAt(camLookTarget);
        if (rawT >= 1) sweepDone = true;
      } else {
        const camTargetX = playerPosRef.current.x + followOffset.x;
        const camTargetZ = playerPosRef.current.z + followOffset.z;
        const camAlpha = expDampingAlpha(CAMERA_SMOOTH_RATE, dt);
        camera.position.x += (camTargetX - camera.position.x) * camAlpha;
        camera.position.z += (camTargetZ - camera.position.z) * camAlpha;
        camera.position.y = followOffset.y;
        camLookTarget.set(playerPosRef.current.x, 0, playerPosRef.current.z);
        camera.lookAt(camLookTarget);
      }

      // ---- Proximity check (interiors OR secrets -> villagers -> buildings) ----
      if (insideRoom) {
        let nextAction: InteriorActionPrompt | null = null;
        if (playerPosRef.current.z >= 73.6) {
          nextAction = {
            id: "exit-interior",
            label: "Exit to Town Square",
            emoji: "🚪",
            actionType: "exit",
          };
        } else if (insideRoom === "tavern") {
          nextAction = {
            id: "tavern-dossier",
            label: "Adventurer's Dossier — Bio & Experience",
            emoji: "📖",
            actionType: "modal",
            buildingId: "tavern",
          };
        } else {
          nextAction = {
            id: "wizard-tome",
            label: "Arcane Character Tome — Skills & Sheet",
            emoji: "🔮",
            actionType: "modal",
            buildingId: "wizard",
          };
        }
        if (nextAction.id !== nearInteriorActionRef.current?.id) {
          nearInteriorActionRef.current = nextAction;
          onNearInteriorActionRef.current?.(nextAction);
        }
      } else {
        if (nearInteriorActionRef.current !== null) {
          nearInteriorActionRef.current = null;
          onNearInteriorActionRef.current?.(null);
        }

        let closestSecret: SecretFindDef | null = null;
        let closestSecDist = SECRET_INTERACT_DISTANCE;
        for (const item of secretItems) {
          if (foundSecretsRef.current.has(item.def.id)) continue;
          const d = Math.hypot(
            playerPosRef.current.x - item.def.x,
            playerPosRef.current.z - item.def.z
          );
          if (d < closestSecDist) {
            closestSecDist = d;
            closestSecret = item.def;
          }
        }
        if (closestSecret?.id !== nearSecretRef.current?.id) {
          nearSecretRef.current = closestSecret;
          onNearSecretRef.current?.(closestSecret);
        }

        let closestVillager: VillagerDef | null = null;
        let closestNpcDist = VILLAGER_INTERACT_DISTANCE;
        for (const vr of villagerRuntimes) {
          const d = Math.hypot(playerPosRef.current.x - vr.x, playerPosRef.current.z - vr.z);
          if (d < closestNpcDist) {
            closestNpcDist = d;
            closestVillager = vr.def;
          }
        }

        if (closestVillager?.id !== nearVillagerRef.current?.id) {
          nearVillagerRef.current = closestVillager;
          onNearVillagerRef.current?.(closestVillager);
        }

        let closestBuilding: BuildingDef | null = null;
        let closestDist = INTERACT_DISTANCE;

        for (const b of BUILDINGS) {
          const distX = playerPosRef.current.x - b.x;
          const distZ = playerPosRef.current.z - b.z;
          const dist = Math.sqrt(distX * distX + distZ * distZ);
          if (dist < closestDist) {
            closestDist = dist;
            closestBuilding = b;
          }
        }

        if (closestBuilding !== nearBuildingRef.current) {
          nearBuildingRef.current = closestBuilding;
          if (closestBuilding) {
            onNearBuilding({ id: closestBuilding.id, name: closestBuilding.name, emoji: closestBuilding.emoji });
          } else {
            onNearBuilding(null);
          }
        }
      }

      // ---- Torch flicker (street lanterns scale smoothly with dusk/night) ----
      torchLights.forEach(({ light, baseIntensity }, i) => {
        const isLantern = baseIntensity <= 1.6;
        const factor = isLantern ? 0.2 + 0.8 * dayNight.lanternFactor : 1;
        light.intensity =
          (baseIntensity +
            Math.sin(elapsed * 8 + i * 2) * 0.4 +
            Math.sin(elapsed * 13 + i * 5) * 0.2 +
            Math.random() * 0.1) *
          factor;
      });

      // ---- Fireflies ----
      const pp = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pp[i * 3 + 1] += Math.sin(elapsed * pSpeeds[i] + i) * 0.18 * dt;
        pp[i * 3] += Math.sin(elapsed * 0.2 + i * 0.5) * 0.12 * dt;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // ---- Beacon bobbing ----
      beacons.forEach(({ mesh, glow, baseY }, i) => {
        const bob = Math.sin(elapsed * 1.5 + i * 0.8) * 0.3;
        mesh.position.y = baseY + bob;
        mesh.rotation.y = elapsed * 0.8 + i;
        glow.position.y = baseY + bob;
        (glow.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(elapsed * 2 + i) * 0.08;
      });

      // ---- Campfire animation ----
      fireCubes.forEach((cube, i) => {
        cube.position.y = 0.2 + Math.abs(Math.sin(elapsed * 4 + i * 1.5)) * 0.4;
        cube.rotation.y = elapsed * 2 + i;
        cube.rotation.x = elapsed * 1.5 + i * 0.5;
        const s = 0.8 + Math.sin(elapsed * 6 + i) * 0.2;
        cube.scale.set(s, s, s);
      });

      // ---- Wizard crystals orbit ----
      crystals.forEach((crystal, i) => {
        const angle = elapsed * 0.5 + (i / 4) * Math.PI * 2;
        crystal.position.x = Math.cos(angle) * 2.5;
        crystal.position.z = -10 + Math.sin(angle) * 2.5;
        crystal.position.y = 4 + Math.sin(elapsed * 2 + i) * 0.5;
        crystal.rotation.y = elapsed * 2;
        crystal.rotation.x = elapsed * 1.5;
      });

      // ---- Magic circle pulse ----
      (magicCircleMat as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(elapsed * 1.5) * 0.1;

      // ---- Chimney smoke ----
      const sp = smokeGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < smokeCount; i++) {
        sp[i * 3 + 1] += smokeSpeeds[i] * dt; // rise
        sp[i * 3] += Math.sin(elapsed + i) * 0.12 * dt; // drift
        // Reset when too high
        if (sp[i * 3 + 1] > 10) {
          const cp = chimneyPositions[i % chimneyPositions.length];
          sp[i * 3] = cp.x + (Math.random() - 0.5) * 0.3;
          sp[i * 3 + 1] = 5;
          sp[i * 3 + 2] = cp.z + (Math.random() - 0.5) * 0.3;
        }
      }
      smokeGeo.attributes.position.needsUpdate = true;

      // ---- Fountain water drops ----
      const dp = dropGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < dropCount; i++) {
        dp[i * 3 + 1] -= dropSpeeds[i] * dt; // fall
        const a = (i / dropCount) * Math.PI * 2;
        const radius = 0.3 + (2.0 - dp[i * 3 + 1]) * 0.3; // spread as they fall
        dp[i * 3] = -3.5 + Math.cos(a + elapsed * 0.5) * radius;
        dp[i * 3 + 2] = -3.5 + Math.sin(a + elapsed * 0.5) * radius;
        // Reset when reaching basin
        if (dp[i * 3 + 1] < 0.3) {
          dp[i * 3 + 1] = 1.9 + Math.random() * 0.2;
        }
      }
      dropGeo.attributes.position.needsUpdate = true;

      // ---- Star twinkle ----
      starMat.opacity = 0.4 + Math.sin(elapsed * 0.4) * 0.15;

      // ---- Render pixelated ----
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(screenScene, screenCam);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // ====== CLEANUP ======
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearHeldInputs);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderTarget.dispose();
      renderer.dispose();
    };
  }, [handleInteract, onNearBuilding]);

  return (
    <div
      ref={mountRef}
      id="town-world"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        zIndex: 0,
        touchAction: "none",
      }}
    />
  );
};

export default TownWorld;
