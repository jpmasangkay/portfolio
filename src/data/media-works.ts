import tavernImage from "@/assets/blender-tavern.png";
import wallowsPoster from "@/assets/photoshop-wallows.png";
import nexonPoster from "@/assets/photoshop-nexon.png";
import magazineFrontBack from "@/assets/magazine-front-back.png";
import magazinePages1to6 from "@/assets/magazine-pages-1-6.png";
import magazinePages2to5 from "@/assets/magazine-pages-2-5.png";
import magazinePages3to4 from "@/assets/magazine-pages-3-4.png";

export interface ArtworkItem {
  title: string;
  description: string;
  image: string;
  category: "poster" | "magazine";
}

export const galleryPosters: ArtworkItem[] = [
  {
    title: "Wallows Tour Poster",
    description:
      "Event-style poster layout with bold typography, high-contrast photo cutout, and textured background.",
    image: wallowsPoster,
    category: "poster",
  },
  {
    title: "Nexon Product Ad",
    description:
      "Gaming product advertisement composition using layered imagery, angled panels, and brand-forward callouts.",
    image: nexonPoster,
    category: "poster",
  },
];

export const galleryMagazines: ArtworkItem[] = [
  {
    title: "Front & Back Cover",
    description: "Editorial print cover design and typographic layout.",
    image: magazineFrontBack,
    category: "magazine",
  },
  {
    title: "Pages 1–6",
    description: "Opening spread layout with grid alignment and photography.",
    image: magazinePages1to6,
    category: "magazine",
  },
  {
    title: "Pages 2–5",
    description: "Feature article multi-column spread composition.",
    image: magazinePages2to5,
    category: "magazine",
  },
  {
    title: "Pages 3–4",
    description: "Centerfold visual spread balancing copy and imagery.",
    image: magazinePages3to4,
    category: "magazine",
  },
];

export const forgeWorks = [
  {
    title: "Medieval Tavern",
    alt: "Medieval Tavern - Blender 3D Render",
    image: tavernImage,
    description:
      "A cozy medieval tavern scene rendered in Blender, featuring warm candlelight, wooden furniture, and atmospheric stone interiors. The perfect place for adventurers to rest between quests.",
    tags: ["Blender", "3D Modeling", "Lighting", "Rendering"],
  },
];
