// ====== ALL PORTFOLIO DATA ======

export const personalInfo = {
  name: "Shealtiel John Paul A. Masangkay",
  email: "shealtieljohnpaulmasangkay@gmail.com",
  phone: "+63 9395135819",
  github: "https://github.com/jpmasangkay",
  linkedin:
    "https://www.linkedin.com/in/shealtiel-john-paul-masangkay-251190358",
  location: "Lucena City, Philippines",
  objective:
    "Computer Science student seeking an OJT placement in software or web development.",
  resumePdf: "Shealtiel-Masangkay-Resume.pdf",
};

export interface EducationItem {
  degree: string;
  school: string;
  years: string;
  details?: string;
}

export const education: EducationItem[] = [
  {
    degree: "Bachelor of Science in Computer Science",
    school: "Sacred Heart College of Lucena City, Inc.",
    years: "2023 – Present",
    details:
      "Relevant Coursework: Data Structures & Algorithms, Object-Oriented Programming (C++ / Java), Database Management Systems (SQL), Web Systems & Technologies, Software Engineering, and Mobile / Game Development.",
  },
  {
    degree: "Senior High School — ICT Strand (Information & Communications Technology)",
    school: "Batangas Eastern Colleges",
    years: "2021 – 2023",
    details:
      "Technical Track: Computer programming fundamentals, web markup (HTML / CSS), digital media & editorial layout (Photoshop), and computer systems servicing.",
  },
];

export const experience = [
  {
    title: "Junior Web Developer (Part-time)",
    company: "Leon Guinto Memorial College, Inc.",
    period: "Jan 2026 – Present",
    duties: [
      "Built student information system features in PHP and MySQL, hosted on Hostinger.",
      "Implemented a multi-copy PDF export function using TCPDF for the Registrar, Accounting, and student records.",
      "Refactored student dashboard frontend and co-developed role-based registrar interfaces (admin, clerk, superadmin).",
    ],
  },
];

export interface ProjectItem {
  title: string;
  tech: string;
  period: string;
  description: string;
  highlights: string[];
  href?: string;
  liveUrl?: string;
  previewImage?: string;
  badge?: string;
}

export const projects: ProjectItem[] = [
  {
    title: "LGMCI Enrollment System",
    tech: "PHP · MySQL · TCPDF",
    period: "Jan 2026 – Present",
    description:
      "Full-stack college enrollment management and student information system deployed for Leon Guinto Memorial College, Inc.",
    highlights: [
      "Engineered role-based registrar workflows (admin, clerk, superadmin) with strand-based fee computation in PHP and MySQL.",
      "Automated multi-copy TCPDF assessment & registration exports for the Registrar, Accounting office, and student records.",
      "Refactored the student portal dashboard UI and shipped production updates hosted on Hostinger.",
    ],
    href: undefined,
    badge: "🏛️ Production · Institutional System",
  },
  {
    title: "Shealtiel's Realm (3D Voxel Portfolio)",
    tech: "TypeScript · React · Three.js · Vitest",
    period: "2026",
    description:
      "Interactive isometric 3D voxel realm and recruiter resume SPA featuring custom WebGL draw-call batching and adaptive quality scaling.",
    highlights: [
      "Built spatial static-mesh geometry batching and a 5-tier EMA hysteresis frame-time quality scaler to sustain smooth FPS.",
      "Programmed AABB sliding collision physics, walk-in building interiors, and procedural Web Audio API zone ambience.",
      "Verified with 45+ Vitest & React Testing Library tests, native accessible <dialog> modals, and print-ready resume mode.",
    ],
    href: "https://github.com/jpmasangkay/portfolio",
    liveUrl: "https://jpmasangkay.github.io/portfolio/",
    previewImage: "og-preview.png",
  },
  {
    title: "Scilab-360",
    tech: "TypeScript · React",
    period: "2026",
    description:
      "Interactive science and virtual laboratory web application built with TypeScript and React.",
    highlights: [
      "Architected modular, type-safe laboratory views and interactive experiment states using React hooks and strict TypeScript.",
      "Designed responsive inspection panels and clean navigation flows for exploring virtual lab modules.",
    ],
    href: "https://github.com/jpmasangkay/scilab-360",
  },
  {
    title: "Grimoire",
    tech: "TypeScript · React",
    period: "2026",
    description:
      "Personal knowledge management and structured note-taking web application.",
    highlights: [
      "Implemented fast client-side note filtering, tag categorization, and keyboard-first entry navigation in React & TypeScript.",
      "Crafted a high-contrast dark reading and annotation workspace with persistent client state.",
    ],
    href: "https://github.com/jpmasangkay/grimoire",
  },
  {
    title: "Germ Shooter",
    tech: "Unity · C#",
    period: "2025",
    description:
      "3D shooter game featuring wave-based enemy spawning, player combat mechanics, and game state management.",
    highlights: [
      "Programmed C# MonoBehaviour systems for enemy wave spawning, projectile collision detection, and player health/score loops.",
      "Structured game state transitions (title, active wave, pause, game-over) and real-time HUD feedback in Unity.",
    ],
    href: "https://github.com/jpmasangkay/germ-shooter",
  },
];

export const repos = [
  {
    title: "grimoire",
    desc: "Personal knowledge management and note-taking web app in TypeScript & React.",
    href: "https://github.com/jpmasangkay/grimoire",
    tags: ["TypeScript"],
  },
  {
    title: "umbra",
    desc: "Weather dashboard web app with clean atmospheric forecast views.",
    href: "https://github.com/jpmasangkay/umbra",
    tags: ["TypeScript"],
  },
  {
    title: "scilab-360",
    desc: "Science and laboratory-themed interactive web application in TypeScript.",
    href: "https://github.com/jpmasangkay/scilab-360",
    tags: ["TypeScript"],
  },
  {
    title: "atlus-website-imitation",
    desc: "Stylized ATLUS-inspired website layout and UI recreation in HTML & CSS.",
    href: "https://github.com/jpmasangkay/atlus-website-imitation",
    tags: ["HTML"],
  },
  {
    title: "marginalia",
    desc: "Minimalist TypeScript reading notes and margin annotation web project.",
    href: "https://github.com/jpmasangkay/marginalia",
    tags: ["TypeScript"],
  },
  {
    title: "simple-employee-details",
    desc: "Employee directory and record CRUD web app using Laravel Blade templates.",
    href: "https://github.com/jpmasangkay/simple-employee-details",
    tags: ["Blade"],
  },
  {
    title: "Flappy-Bird",
    desc: "Classic Flappy Bird arcade game clone built with C#.",
    href: "https://github.com/jpmasangkay/Flappy-Bird",
    tags: ["C#"],
  },
  {
    title: "app-calculator",
    desc: "Android mobile calculator application written in Kotlin.",
    href: "https://github.com/jpmasangkay/app-calculator",
    tags: ["Kotlin"],
  },
  {
    title: "germ-shooter",
    desc: "3D shooter game with enemy wave spawning and game state logic in Unity C#.",
    href: "https://github.com/jpmasangkay/germ-shooter",
    tags: ["C#"],
  },
  {
    title: "dark-horizon",
    desc: "Java application exploring dark-fantasy desktop/game programming patterns.",
    href: "https://github.com/jpmasangkay/dark-horizon",
    tags: ["Java"],
  },
  {
    title: "valentines-day-2026",
    desc: "Interactive seasonal web greeting experience crafted in TypeScript.",
    href: "https://github.com/jpmasangkay/valentines-day-2026",
    tags: ["TypeScript"],
  },
];

export const skills = {
  intermediate: ["TypeScript", "React", "C++", "Git"],
  beginner: ["PHP", "Laravel", "Java", "MERN Stack", "SQL", "Unity / C#", "Kotlin", "Flutter"],
  tools: ["Blender", "Photoshop", "VS Code", "Android Studio"],
};

export interface CertificateItem {
  name: string;
  issuer: string;
  year: string;
  url: string;
  linkLabel: string;
  summary: string;
  verifyUrl: string;
}

export const certificates: CertificateItem[] = [
  {
    name: "Gemini Certified",
    issuer: "Google",
    year: "2026",
    url: "https://educertifications.google",
    linkLabel: "Program Portal ↗",
    summary:
      "Validated competency in Google Gemini AI workflows, prompt engineering, and responsible generative AI integration.",
    verifyUrl:
      "https://www.linkedin.com/in/shealtiel-john-paul-masangkay-251190358",
  },
  {
    name: "Hour of Code (Minecraft)",
    issuer: "Microsoft",
    year: "2026",
    url: "https://education.minecraft.net/en-us/lessons/hour-of-code",
    linkLabel: "Program Page ↗",
    summary:
      "Completed algorithmic problem-solving, control-flow automation, and computational logic challenges via Microsoft Education.",
    verifyUrl:
      "https://www.linkedin.com/in/shealtiel-john-paul-masangkay-251190358",
  },
  {
    name: "Trademark Awareness Session",
    issuer: "Ateneo",
    year: "2026",
    url: "https://aipo.ateneo.edu",
    linkLabel: "Ateneo IPO ↗",
    summary:
      "Trained on intellectual property fundamentals, software/brand trademark protection, and innovation compliance with Ateneo IPO.",
    verifyUrl:
      "https://www.linkedin.com/in/shealtiel-john-paul-masangkay-251190358",
  },
];

// Building definitions for the town
export type BuildingId = "gate" | "tavern" | "questboard" | "wizard" | "gallery" | "forge" | "noticeboard" | "exit";

export interface TownBuilding {
  id: BuildingId;
  name: string;
  emoji: string;
  description: string;
}

export const townBuildings: TownBuilding[] = [
  { id: "gate", name: "Town Gate", emoji: "🏰", description: "Welcome, adventurer!" },
  { id: "tavern", name: "The Tavern", emoji: "🍺", description: "Rest and review your character sheet" },
  { id: "questboard", name: "Quest Board", emoji: "📜", description: "Browse available quests and scrolls" },
  { id: "wizard", name: "Wizard's Tower", emoji: "🧙", description: "Study the arcane proficiencies" },
  { id: "gallery", name: "The Gallery", emoji: "🎨", description: "View the arcane artworks" },
  { id: "forge", name: "The Forge", emoji: "⚒️", description: "Inspect forged 3D creations" },
  { id: "noticeboard", name: "Notice Board", emoji: "🏆", description: "Achievements and certificates" },
  { id: "exit", name: "Town Exit", emoji: "🕊️", description: "Send a raven or depart" },
];
