export interface VillagerDef {
  id: string;
  name: string;
  role: string;
  emoji: string;
  x: number;
  z: number;
  rotY: number;
  tunicColor: number;
  hatColor: number;
  skinColor: number;
  patrolTo?: { x: number; z: number };
  speed?: number;
  isGreeter?: boolean;
  lines: [string, string, string];
}

export const VILLAGERS: VillagerDef[] = [
  {
    id: "greeter-rowan",
    name: "Rowan",
    role: "Town Greeter",
    emoji: "🧭",
    x: 1.9,
    z: 8.6,
    rotY: -0.6,
    tunicColor: 0x3b6e52,
    hatColor: 0xc89a32,
    skinColor: 0xe6be94,
    isGreeter: true,
    lines: [
      "Welcome to Shealtiel's Realm! Move with WASD / Arrows (or drag the thumbstick on touch) and press E / Space or tap ⚔️ near buildings.",
      "In a hurry? Hit Quick View in the top-right for a plain single-page resume, or click any landmark in the Building Guide!",
      "All four town gates now open onto the Whispering Forest (west), Moonlit Lakeside (east), and Ruined Hilltop (north).",
    ],
  },
  {
    id: "innkeeper-bram",
    name: "Bram",
    role: "Tavern Keeper",
    emoji: "🍺",
    x: -6.3,
    z: 11.6,
    rotY: 0.4,
    tunicColor: 0x7d4b32,
    hatColor: 0x4a3020,
    skinColor: 0xddb88a,
    lines: [
      "Step inside The Tavern to read Shealtiel's bio, education at Sacred Heart College, and his part-time dev work at LGMCI.",
      "He built PHP/MySQL student info features and multi-copy TCPDF exports for the Registrar and Accounting offices.",
      "If you're checking his OJT availability, The Tavern dossier has his full contact address too.",
    ],
  },
  {
    id: "scribe-mira",
    name: "Mira",
    role: "Guild Scribe",
    emoji: "📜",
    x: 2.2,
    z: 3.6,
    rotY: 0,
    tunicColor: 0x3f5e88,
    hatColor: 0x2c3e5e,
    skinColor: 0xf0c9a0,
    patrolTo: { x: 2.2, z: 6.2 },
    speed: 1.4,
    lines: [
      "The Quest Board showcases four featured builds: LGMCI Enrollment System, Scilab-360, Germ Shooter, and Grimoire.",
      "Every GitHub commission pinned on that board links straight to its source repository.",
      "Grimoire and Scilab-360 are both built in TypeScript and React—worth inspecting up close!",
    ],
  },
  {
    id: "apprentice-pip",
    name: "Pip",
    role: "Tower Apprentice",
    emoji: "🧙",
    x: -2.2,
    z: -7.2,
    rotY: 0.2,
    tunicColor: 0x5c468c,
    hatColor: 0x3b2c68,
    skinColor: 0xffd5a8,
    patrolTo: { x: 2.2, z: -7.2 },
    speed: 1.3,
    lines: [
      "Ask the wizard what he's learning lately—his shelves are full of TypeScript, React, C++, and Git.",
      "He's also practiced PHP, Laravel, Java, SQL, Unity C#, Kotlin, and Flutter across school and personal builds.",
      "Climb north past the Tower and you'll reach the steps up to the Ruined Hilltop!",
    ],
  },
  {
    id: "artist-elena",
    name: "Elena",
    role: "Gallery Curator",
    emoji: "🎨",
    x: 11.5,
    z: 2.5,
    rotY: -1.0,
    tunicColor: 0x4a5a6a,
    hatColor: 0xaa3333,
    skinColor: 0xccaa88,
    lines: [
      "Inside The Gallery hang Photoshop event posters, product ads, and full multi-page magazine spreads.",
      "Click any framed piece in The Gallery to open a full-resolution lightbox view with keyboard arrows.",
      "Pass through the East Gate behind me if you want to stroll down to the Moonlit Lakeside dock.",
    ],
  },
  {
    id: "smith-tovin",
    name: "Tovin",
    role: "Forge Master",
    emoji: "⚒️",
    x: -6.2,
    z: -1.8,
    rotY: 1.2,
    tunicColor: 0x624444,
    hatColor: 0x3a2e2e,
    skinColor: 0xd6a67c,
    patrolTo: { x: -6.2, z: -4.4 },
    speed: 1.1,
    lines: [
      "Here at The Forge, Shealtiel trades steel for polygons—inspect his Medieval Tavern Blender 3D render inside.",
      "Warm candlelight, timber framing, and hand-placed props—all modeled and lit in Blender.",
      "Head west past the wagon and garden fence to explore the firefly clearing in Whispering Forest.",
    ],
  },
  {
    id: "herald-alden",
    name: "Alden",
    role: "Town Herald",
    emoji: "🏆",
    x: 6.2,
    z: 8.8,
    rotY: -0.7,
    tunicColor: 0x6a6240,
    hatColor: 0x454028,
    skinColor: 0xe2bc92,
    lines: [
      "The Notice Board carries Shealtiel's 2026 credentials from Google, Microsoft, and Ateneo—each linked to its program portal.",
      "Over by the northeast corner sits the Town Exit—stop there anytime for GitHub, LinkedIn, and email.",
      "Visit all 8 landmarks in your Quest Log to unlock the Royal Cloak and the Hire Me Contract Scroll!",
    ],
  },
  {
    id: "ranger-kael",
    name: "Kael",
    role: "Outskirts Ranger",
    emoji: "🌲",
    x: -21.5,
    z: 1.0,
    rotY: 0.8,
    tunicColor: 0x365c3a,
    hatColor: 0x254228,
    skinColor: 0xdab086,
    patrolTo: { x: -25.5, z: 7.5 },
    speed: 1.35,
    lines: [
      "You found the Whispering Forest! Follow the lanterns southwest to the hidden firefly clearing.",
      "Have you visited the lakeside dock to the east or climbed the northern steps to the ruined campfire?",
      "Keep your eyes sharp in every zone—there are hidden curiosities tucked away for thorough explorers.",
    ],
  },
];
