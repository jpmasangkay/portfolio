import PixelNav from "@/components/PixelNav";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ProjectGrid from "@/components/ProjectGrid";
import BlenderSection from "@/components/BlenderSection";
import PhotoshopSection from "@/components/PhotoshopSection";
import Footer from "@/components/Footer";

const repos = [
  {
    title: "grimoire",
    description: "Public repo (TypeScript). Updated Mar 24, 2026.",
    href: "https://github.com/jpmasangkay/grimoire",
    tags: ["TypeScript"],
  },
  {
    title: "umbra",
    description: "weather-dashboard (TypeScript). Updated Mar 23, 2026.",
    href: "https://github.com/jpmasangkay/umbra",
    tags: ["TypeScript"],
  },
  {
    title: "scilab-360",
    description: "Public repo (TypeScript). Updated Mar 23, 2026.",
    href: "https://github.com/jpmasangkay/scilab-360",
    tags: ["TypeScript"],
  },
  {
    title: "atlus-website-imitation",
    description: "Public repo (HTML). Updated Mar 14, 2026.",
    href: "https://github.com/jpmasangkay/atlus-website-imitation",
    tags: ["HTML"],
  },
  {
    title: "marginalia",
    description: "Public repo (TypeScript). Updated Mar 13, 2026.",
    href: "https://github.com/jpmasangkay/marginalia",
    tags: ["TypeScript"],
  },
  {
    title: "simple-employee-details",
    description: "Public repo (Blade). Updated Mar 9, 2026.",
    href: "https://github.com/jpmasangkay/simple-employee-details",
    tags: ["Blade"],
  },
  {
    title: "Flappy-Bird",
    description: "Public repo (C#). Updated Mar 4, 2026.",
    href: "https://github.com/jpmasangkay/Flappy-Bird",
    tags: ["C#"],
  },
  {
    title: "app-calculator",
    description: "Public repo (Kotlin). Updated Feb 28, 2026.",
    href: "https://github.com/jpmasangkay/app-calculator",
    tags: ["Kotlin"],
  },
  {
    title: "germ-shooter",
    description: "Public repo (C#). Updated Feb 28, 2026.",
    href: "https://github.com/jpmasangkay/germ-shooter",
    tags: ["C#"],
  },
  {
    title: "dark-horizon",
    description: "Public repo (Java). Updated Feb 28, 2026.",
    href: "https://github.com/jpmasangkay/dark-horizon",
    tags: ["Java"],
  },
  {
    title: "valentines-day-2026",
    description: "Public repo (TypeScript). Updated Feb 14, 2026.",
    href: "https://github.com/jpmasangkay/valentines-day-2026",
    tags: ["TypeScript"],
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <PixelNav />
      <HeroSection />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <AboutSection />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <ProjectGrid id="repos" heading="// Repositories" projects={repos} columns={3} />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <PhotoshopSection />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <BlenderSection />
      <Footer />
    </div>
  );
};

export default Index;
