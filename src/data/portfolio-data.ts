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
};

export const education = [
  {
    degree: "Bachelor of Science in Computer Science",
    school: "Sacred Heart College of Lucena City, Inc.",
    years: "2023 – Present",
  },
  {
    degree: "ICT Graduate",
    school: "Batangas Eastern Colleges",
    years: "2021 – 2023",
  },
  {
    degree: "Junior High School Graduate",
    school: "Batangas Eastern Colleges",
    years: "2017 – 2021",
  },
  {
    degree: "Elementary Graduate",
    school: "Nagsaulay Elementary School",
    years: "2010 – 2016",
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

export const projects = [
  {
    title: "LGMCI Enrollment System",
    tech: "PHP · MySQL · TCPDF",
    period: "Jan 2026 – Present",
    description:
      "Full-stack enrollment management system with student records, strand-based fee computation, PDF export, and role-based access control.",
    href: undefined as string | undefined,
  },
  {
    title: "Scilab-360",
    tech: "TypeScript · React",
    period: "2026",
    description: "Science/lab-themed web application built with TypeScript and React.",
    href: "https://github.com/jpmasangkay/scilab-360",
  },
  {
    title: "Germ Shooter",
    tech: "Unity · C#",
    period: "2025",
    description:
      "3D shooter game featuring enemy spawning, player mechanics, and game state management.",
    href: "https://github.com/jpmasangkay/germ-shooter",
  },
  {
    title: "Grimoire",
    tech: "TypeScript · React",
    period: "2026",
    description: "Personal knowledge management and note-taking web application.",
    href: "https://github.com/jpmasangkay/grimoire",
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

export const certificates = [
  {
    name: "Gemini Certified",
    issuer: "Google",
    year: "2026",
    url: "https://educertifications.google",
    linkLabel: "Program Portal ↗",
  },
  {
    name: "Hour of Code (Minecraft)",
    issuer: "Microsoft",
    year: "2026",
    url: "https://education.minecraft.net/en-us/lessons/hour-of-code",
    linkLabel: "Program Page ↗",
  },
  {
    name: "Trademark Awareness Session",
    issuer: "Ateneo",
    year: "2026",
    url: "https://aipo.ateneo.edu",
    linkLabel: "Ateneo IPO ↗",
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
