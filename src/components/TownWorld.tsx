import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import type { BuildingId } from "@/data/portfolio-data";
import { mobileInput, consumeMobileInteract } from "@/lib/mobile-input";

interface TownWorldProps {
  onInteract: (buildingId: BuildingId) => void;
  onNearBuilding: (building: { id: BuildingId; name: string; emoji: string } | null) => void;
  modalOpen: boolean;
}

// ====== BUILDING LAYOUT ======
interface BuildingDef {
  id: BuildingId;
  name: string;
  emoji: string;
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  roofH: number;
  wallColor: number;
  roofColor: number;
  hasWindows?: boolean;
  rotY?: number;
}

const BUILDINGS: BuildingDef[] = [
  // Spawn: Town Gate (south)
  { id: "gate", name: "Town Gate", emoji: "🏰", x: 0, z: 14, w: 5, h: 5, d: 2, roofH: 2.5, wallColor: 0x7a7088, roofColor: 0x6a5545, hasWindows: false },
  // Tavern (south-west)
  { id: "tavern", name: "The Tavern", emoji: "🍺", x: -8, z: 8, w: 5, h: 3.5, d: 5, roofH: 2, wallColor: 0x8a6040, roofColor: 0xa8622a, hasWindows: true },
  // Quest Board (center - just a post, but we give it a small shed)
  { id: "questboard", name: "Quest Board", emoji: "📜", x: 0, z: 3, w: 2, h: 3, d: 1, roofH: 1, wallColor: 0x7a5838, roofColor: 0x5a4030, hasWindows: false },
  // Wizard's Tower (north)
  { id: "wizard", name: "Wizard's Tower", emoji: "🧙", x: 0, z: -10, w: 3.5, h: 7, d: 3.5, roofH: 3, wallColor: 0x6a5a8a, roofColor: 0x4a3a6a, hasWindows: true },
  // Gallery (east)
  { id: "gallery", name: "The Gallery", emoji: "🎨", x: 9, z: 0, w: 5, h: 3, d: 4, roofH: 1.8, wallColor: 0x8a7a68, roofColor: 0x9a6a3a, hasWindows: true },
  // Forge (west)
  { id: "forge", name: "The Forge", emoji: "⚒️", x: -9, z: -2, w: 4, h: 3, d: 4, roofH: 1.5, wallColor: 0x6a5858, roofColor: 0x5a4030, hasWindows: true },
  // Notice Board (east-south)
  { id: "noticeboard", name: "Notice Board", emoji: "🏆", x: 8, z: 8, w: 2.5, h: 2.5, d: 2, roofH: 1.2, wallColor: 0x7a6a58, roofColor: 0x8a6a3a, hasWindows: false },
  // Town Exit (north-east)
  { id: "exit", name: "Town Exit", emoji: "🕊️", x: 10, z: -10, w: 3, h: 4, d: 2, roofH: 2, wallColor: 0x7a7a88, roofColor: 0x6a6070, hasWindows: false },
];

const INTERACT_DISTANCE = 4.5;
const MOVE_SPEED = 0.12;
const PLAYER_RADIUS = 0.6;
const PIXEL_SCALE = 3; // render at 1/3 resolution for pixel art

const TownWorld = ({ onInteract, onNearBuilding, modalOpen }: TownWorldProps) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const playerPosRef = useRef(new THREE.Vector3(0, 0, 16.5));
  const nearBuildingRef = useRef<BuildingDef | null>(null);
  const animFrameRef = useRef<number>(0);
  const modalOpenRef = useRef(modalOpen);

  // Keep modalOpen ref in sync
  useEffect(() => {
    modalOpenRef.current = modalOpen;
  }, [modalOpen]);

  const handleInteract = useCallback(() => {
    if (modalOpenRef.current) return;
    const near = nearBuildingRef.current;
    if (near) {
      onInteract(near.id);
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
    scene.background = new THREE.Color(0x1a1832);
    scene.fog = new THREE.Fog(0x1a1832, 30, 55);

    // ====== CAMERA (isometric) ======
    const aspect = window.innerWidth / window.innerHeight;
    const camSize = 12;
    const camera = new THREE.OrthographicCamera(
      -camSize * aspect, camSize * aspect,
      camSize, -camSize,
      0.1, 100
    );
    // Isometric angle
    camera.position.set(15, 18, 15);
    camera.lookAt(0, 0, 0);

    // ====== MATERIALS ======
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3a4a30 });
    const pathMat = new THREE.MeshLambertMaterial({ color: 0x8a7a68 });
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x3366cc, transparent: true, opacity: 0.7 });

    // ====== GROUND (multi-layered) ======
    // Base dark earth
    const groundBase = new THREE.Mesh(
      new THREE.BoxGeometry(54, 0.3, 54),
      new THREE.MeshLambertMaterial({ color: 0x2a3a20 })
    );
    groundBase.position.y = -0.35;
    groundBase.receiveShadow = true;
    scene.add(groundBase);
    // Main grass layer
    const ground = new THREE.Mesh(new THREE.BoxGeometry(50, 0.5, 50), groundMat);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
    // Lighter grass patches (varied terrain)
    const lightGrassMat = new THREE.MeshLambertMaterial({ color: 0x4a5a38 });
    const darkGrassMat = new THREE.MeshLambertMaterial({ color: 0x2e3e24 });
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
    const buildingBounds: { def: BuildingDef; minX: number; maxX: number; minZ: number; maxZ: number }[] = [];
    const beacons: { mesh: THREE.Mesh; glow: THREE.Mesh; baseY: number }[] = [];

    BUILDINGS.forEach((b) => {
      const group = new THREE.Group();
      const wallMat = new THREE.MeshLambertMaterial({ color: b.wallColor });
      const roofMaterial = new THREE.MeshLambertMaterial({ color: b.roofColor });

      // Main body
      const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), wallMat);
      body.position.y = b.h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

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

      // Door (dark rectangle on front)
      const doorMat = new THREE.MeshLambertMaterial({ color: 0x2a1a10 });
      const doorGeo = new THREE.BoxGeometry(b.w * 0.25, b.h * 0.45, 0.15);
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, b.h * 0.22, b.d / 2 + 0.08);
      group.add(door);

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
      if (b.hasWindows || b.id === "gate") {
        // Horizontal beams
        for (let ty = 0; ty <= 1; ty++) {
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

      // ---- DOOR FRAME ----
      const frameMat = new THREE.MeshLambertMaterial({ color: 0x3a2a18 });
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

      // -- GATE: Arch decoration, portcullis lines, shield emblem --
      if (b.id === "gate") {
        // Arch over door
        const archMat = new THREE.MeshLambertMaterial({ color: 0x5a5068 });
        const arch = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.35, 0.2, 0.3), archMat);
        arch.position.set(0, b.h * 0.5, b.d / 2 + 0.15);
        group.add(arch);
        // Portcullis bars
        const barMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        for (let pb = -2; pb <= 2; pb++) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, b.h * 0.44, 0.04), barMat);
          bar.position.set(pb * 0.2, b.h * 0.22, b.d / 2 + 0.2);
          group.add(bar);
        }
        // Horizontal bars
        for (let hb = 0; hb < 3; hb++) {
          const hBar = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.3, 0.04, 0.04), barMat);
          hBar.position.set(0, b.h * 0.1 + hb * b.h * 0.12, b.d / 2 + 0.2);
          group.add(hBar);
        }
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
      buildingBounds.push({
        def: b,
        minX: b.x - b.w / 2 - pad,
        maxX: b.x + b.w / 2 + pad,
        minZ: b.z - b.d / 2 - pad,
        maxZ: b.z + b.d / 2 + pad,
      });

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
      buildingBounds.push({
        def: { id: "gate", name: "", emoji: "", x, z, w: 1, h: 1, d: 1, roofH: 0, wallColor: 0, roofColor: 0 },
        minX: x - 0.5, maxX: x + 0.5, minZ: z - 0.5, maxZ: z + 0.5,
      });
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
      buildingBounds.push({
        def: { id: "gate", name: "", emoji: "", x, z, w: 1, h: 1, d: 1, roofH: 0, wallColor: 0, roofColor: 0 },
        minX: x - 0.5, maxX: x + 0.5, minZ: z - 0.5, maxZ: z + 0.5,
      });
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
      buildingBounds.push({
        def: { id: "gate", name: "", emoji: "", x, z, w: 1, h: 1, d: 1, roofH: 0, wallColor: 0, roofColor: 0 },
        minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.4, maxZ: z + 0.4,
      });
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
      buildingBounds.push({
        def: { id: "gate", name: "", emoji: "", x, z, w: 1, h: 1, d: 1, roofH: 0, wallColor: 0, roofColor: 0 },
        minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.4, maxZ: z + 0.4,
      });
    };

    // Scatter trees (mixed types)
    addOak(-14, -8);
    addPine(-12, 4);
    addOak(14, 5, 4);
    addBirch(13, -3);
    addPine(-13, -1, 3.5);
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

    // Well in town square
    const wellMat = new THREE.MeshLambertMaterial({ color: 0x5a5565 });
    const well = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 1, 8), wellMat);
    well.position.set(-3, 0.5, 0);
    well.castShadow = true;
    scene.add(well);
    const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1, 4), new THREE.MeshLambertMaterial({ color: 0x5c3d2e }));
    wellRoof.position.set(-3, 2.3, 0);
    wellRoof.rotation.y = Math.PI / 4;
    scene.add(wellRoof);
    // Well supports
    for (let i = 0; i < 2; i++) {
      const sup = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), new THREE.MeshLambertMaterial({ color: 0x4a3020 }));
      sup.position.set(-3 + (i === 0 ? -0.6 : 0.6), 1.5, 0);
      scene.add(sup);
    }

    // Fence posts along edges
    const fenceBoardMat = new THREE.MeshLambertMaterial({ color: 0x4a3a20 });
    for (let i = -18; i <= 18; i += 3) {
      // X edges
      [[-20, i], [20, i]].forEach(([fx, fz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), fenceMat);
        post.position.set(fx as number, 0.75, fz as number);
        scene.add(post);
      });
      // Z edges
      [[i, -18], [i, 20]].forEach(([fx, fz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), fenceMat);
        post.position.set(fx as number, 0.75, fz as number);
        scene.add(post);
      });
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
    // East wall
    for (let z = -14; z <= 16; z += 4) {
      addWallSegment(18, z, 0.8, 4);
    }
    // West wall
    for (let z = -14; z <= 16; z += 4) {
      addWallSegment(-18, z, 0.8, 4);
    }
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
      smokeSpeeds[i] = 0.005 + Math.random() * 0.01;
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
      dropSpeeds[i] = 0.02 + Math.random() * 0.02;
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

    // ====== WEATHER VANE (on tavern roof) ======
    const vaneMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const vanePole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05), vaneMat);
    vanePole.position.set(-8, 5 + 2 + 0.5, 8);
    scene.add(vanePole);
    const vaneArrow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.04), vaneMat);
    vaneArrow.position.set(-8, 5 + 2 + 0.8, 8);
    scene.add(vaneArrow);
    // Arrow tip
    const vaneHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.2, 3),
      new THREE.MeshLambertMaterial({ color: 0xccaa33 })
    );
    vaneHead.position.set(-7.6, 5 + 2 + 0.8, 8);
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

    // ====== VILLAGER NPC (stationary, near well) ======
    const npcGroup = new THREE.Group();
    // NPC body
    const npcBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.7, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x6a5040 })
    );
    npcBody.position.y = 0.85;
    npcGroup.add(npcBody);
    // NPC head
    const npcHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xddb88a })
    );
    npcHead.position.y = 1.35;
    npcGroup.add(npcHead);
    // NPC hat
    const npcHat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 0.15, 6),
      new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
    );
    npcHat.position.y = 1.55;
    npcGroup.add(npcHat);
    // NPC legs
    for (let nl = -1; nl <= 1; nl += 2) {
      const npcLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.5, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
      );
      npcLeg.position.set(nl * 0.12, 0.25, 0);
      npcGroup.add(npcLeg);
    }
    npcGroup.position.set(-1.5, 0, 0);
    npcGroup.rotation.y = 0.5;
    scene.add(npcGroup);

    // ====== SECOND NPC (by gallery) ======
    const npc2Group = new THREE.Group();
    const npc2Body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.7, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x4a5a6a })
    );
    npc2Body.position.y = 0.85;
    npc2Group.add(npc2Body);
    const npc2Head = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xccaa88 })
    );
    npc2Head.position.y = 1.35;
    npc2Group.add(npc2Head);
    // NPC2 beret (artist)
    const npc2Beret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.2, 0.08, 6),
      new THREE.MeshLambertMaterial({ color: 0xaa3333 })
    );
    npc2Beret.position.y = 1.55;
    npc2Group.add(npc2Beret);
    for (let nl = -1; nl <= 1; nl += 2) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.5, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x3a3a4a })
      );
      leg.position.set(nl * 0.12, 0.25, 0);
      npc2Group.add(leg);
    }
    npc2Group.position.set(11.5, 0, 2.5);
    npc2Group.rotation.y = -1;
    scene.add(npc2Group);

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

    // Legs (dark leather boots)
    const legMat = new THREE.MeshLambertMaterial({ color: 0x2a1a12 });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.3), legMat);
    legL.position.set(-0.15, 0.25, 0);
    playerGroup.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.3), legMat);
    legR.position.set(0.15, 0.25, 0);
    playerGroup.add(legR);

    // Body (dark leather tunic)
    const playerBodyMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const playerBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.4), playerBodyMat);
    playerBody.position.y = 0.8;
    playerGroup.add(playerBody);

    // Belt
    const beltMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.45), beltMat);
    belt.position.y = 0.55;
    playerGroup.add(belt);
    // Belt buckle
    const buckleMat = new THREE.MeshLambertMaterial({ color: 0xccaa44 });
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.02), buckleMat);
    buckle.position.set(0, 0.55, 0.24);
    playerGroup.add(buckle);

    // Head
    const playerHeadMat = new THREE.MeshLambertMaterial({ color: 0xffcc88 });
    const playerHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), playerHeadMat);
    playerHead.position.y = 1.45;
    playerGroup.add(playerHead);

    // Hood (rogue hood - dark cloak)
    const cloakHoodMat = new THREE.MeshLambertMaterial({ color: 0x1a1a22 });
    // Hood top
    const hoodTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), cloakHoodMat);
    hoodTop.position.y = 1.8;
    playerGroup.add(hoodTop);
    // Hood sides
    const hoodBack = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.5, 0.12), cloakHoodMat);
    hoodBack.position.set(0, 1.5, -0.3);
    playerGroup.add(hoodBack);
    // Hood front edge
    const hoodFront = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.05), cloakHoodMat);
    hoodFront.position.set(0, 1.7, 0.3);
    playerGroup.add(hoodFront);

    // Cape (flowing behind)
    const capeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a22 });
    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.08), capeMat);
    cape.position.set(0, 0.75, -0.25);
    playerGroup.add(cape);

    // Dagger (right hand) - blade + handle
    const bladeMat = new THREE.MeshLambertMaterial({ color: 0xccccdd });
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
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
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xaaffaa });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), eyeMat);
    eyeL.position.set(-0.1, 1.5, 0.26);
    playerGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), eyeMat);
    eyeR.position.set(0.1, 1.5, 0.26);
    playerGroup.add(eyeR);

    playerGroup.position.copy(playerPosRef.current);
    playerGroup.castShadow = true;
    scene.add(playerGroup);

    // ====== LIGHTING ======
    // Ambient — bright enough to see everything clearly
    const ambient = new THREE.AmbientLight(0x4444aa, 1.4);
    scene.add(ambient);

    // Moonlight — strong and warm-tinted
    const moon = new THREE.DirectionalLight(0x8888cc, 1.0);
    moon.position.set(-10, 20, -5);
    moon.castShadow = true;
    moon.shadow.mapSize.width = 2048;
    moon.shadow.mapSize.height = 2048;
    moon.shadow.camera.near = 0.5;
    moon.shadow.camera.far = 60;
    moon.shadow.camera.left = -25;
    moon.shadow.camera.right = 25;
    moon.shadow.camera.top = 25;
    moon.shadow.camera.bottom = -25;
    scene.add(moon);

    // Secondary fill light from opposite side
    const fill = new THREE.DirectionalLight(0x6655aa, 0.4);
    fill.position.set(10, 12, 8);
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

    // ====== PARTICLES (fireflies) ======
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 40;
      pPositions[i * 3 + 1] = Math.random() * 4 + 0.5;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
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
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e" || e.key === " ") {
        handleInteract();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ====== RESIZE ======
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const a = w / h;
      camera.left = -camSize * a;
      camera.right = camSize * a;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderTarget.setSize(Math.floor(w / PIXEL_SCALE), Math.floor(h / PIXEL_SCALE));
    };
    window.addEventListener("resize", onResize);

    // ====== COLLISION CHECK ======
    const checkCollision = (x: number, z: number): boolean => {
      for (const b of buildingBounds) {
        if (
          x + PLAYER_RADIUS > b.minX &&
          x - PLAYER_RADIUS < b.maxX &&
          z + PLAYER_RADIUS > b.minZ &&
          z - PLAYER_RADIUS < b.maxZ
        ) {
          return true;
        }
      }
      // World bounds
      if (Math.abs(x) > 19 || z > 19 || z < -17) return true;
      return false;
    };

    // ====== ANIMATION ======
    const clock = new THREE.Clock();
    let walkCycle = 0;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const keys = keysRef.current;

      // ---- Player movement ----
      if (!modalOpenRef.current) {
        let dx = 0;
        let dz = 0;
        // Isometric movement: map WASD to isometric axes
        if (keys.has("w") || keys.has("arrowup")) { dx -= 1; dz -= 1; }
        if (keys.has("s") || keys.has("arrowdown")) { dx += 1; dz += 1; }
        if (keys.has("a") || keys.has("arrowleft")) { dx -= 1; dz += 1; }
        if (keys.has("d") || keys.has("arrowright")) { dx += 1; dz -= 1; }

        // Mobile d-pad input (reads directly from shared module)
        if (mobileInput.dz < 0) { dx -= 1; dz -= 1; } // up
        if (mobileInput.dz > 0) { dx += 1; dz += 1; } // down
        if (mobileInput.dx < 0) { dx -= 1; dz += 1; } // left
        if (mobileInput.dx > 0) { dx += 1; dz -= 1; } // right

        // Mobile interact button
        if (consumeMobileInteract()) {
          handleInteract();
        }

        if (dx !== 0 || dz !== 0) {
          const len = Math.sqrt(dx * dx + dz * dz);
          dx = (dx / len) * MOVE_SPEED;
          dz = (dz / len) * MOVE_SPEED;

          const newX = playerPosRef.current.x + dx;
          const newZ = playerPosRef.current.z + dz;

          if (!checkCollision(newX, playerPosRef.current.z)) {
            playerPosRef.current.x = newX;
          }
          if (!checkCollision(playerPosRef.current.x, newZ)) {
            playerPosRef.current.z = newZ;
          }

          // Face direction
          playerGroup.rotation.y = Math.atan2(dx, dz);

          // Walk animation — full body
          walkCycle += 0.18;
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
          playerBody.position.y = 0.8 + Math.abs(Math.sin(walkCycle * 2)) * 0.04;
          playerHead.position.y = 1.45 + Math.abs(Math.sin(walkCycle * 2)) * 0.04;
          hoodTop.position.y = 1.8 + Math.abs(Math.sin(walkCycle * 2)) * 0.04;

          // Cape flutter
          cape.rotation.x = swing * 0.15;
          cape.position.z = -0.25 - Math.abs(swing) * 0.05;
        } else {
          // Idle — smoothly return to default
          legL.rotation.x *= 0.8;
          legR.rotation.x *= 0.8;
          legL.position.y = 0.25;
          legR.position.y = 0.25;
          legL.position.z *= 0.8;
          legR.position.z *= 0.8;
          rBlade.rotation.x *= 0.8;
          rHandle.rotation.x *= 0.8;
          lBlade.rotation.x *= 0.8;
          lHandle.rotation.x *= 0.8;
          playerBody.position.y = 0.8;
          playerHead.position.y = 1.45;
          hoodTop.position.y = 1.8;
          cape.rotation.x *= 0.85;
          cape.position.z = -0.25;
        }

        playerGroup.position.set(
          playerPosRef.current.x,
          0,
          playerPosRef.current.z
        );
      }

      // ---- Camera follow player ----
      const camTargetX = playerPosRef.current.x + 15;
      const camTargetZ = playerPosRef.current.z + 15;
      camera.position.x += (camTargetX - camera.position.x) * 0.08;
      camera.position.z += (camTargetZ - camera.position.z) * 0.08;
      camera.position.y = 18;
      camera.lookAt(
        playerPosRef.current.x,
        0,
        playerPosRef.current.z
      );

      // ---- Proximity check ----
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

      // ---- Torch flicker ----
      torchLights.forEach(({ light, baseIntensity }, i) => {
        light.intensity =
          baseIntensity +
          Math.sin(elapsed * 8 + i * 2) * 0.4 +
          Math.sin(elapsed * 13 + i * 5) * 0.2 +
          Math.random() * 0.1;
      });

      // ---- Fireflies ----
      const pp = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pp[i * 3 + 1] += Math.sin(elapsed * pSpeeds[i] + i) * 0.003;
        pp[i * 3] += Math.sin(elapsed * 0.2 + i * 0.5) * 0.002;
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
        sp[i * 3 + 1] += smokeSpeeds[i]; // rise
        sp[i * 3] += Math.sin(elapsed + i) * 0.002; // drift
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
        dp[i * 3 + 1] -= dropSpeeds[i]; // fall
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

    animate();

    // ====== CLEANUP ======
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
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
