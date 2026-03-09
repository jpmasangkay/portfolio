import PixelNav from "@/components/PixelNav";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ProjectGrid from "@/components/ProjectGrid";
import BlenderSection from "@/components/BlenderSection";
import Footer from "@/components/Footer";

import websiteImg from "@/assets/website-1.jpg";
import gameImg from "@/assets/game-1.jpg";
import appImg from "@/assets/app-1.jpg";
import designImg from "@/assets/design-1.jpg";

const websites = [
  { title: "Project Website 1", description: "A responsive web application built with modern technologies.", image: websiteImg, tags: ["React", "Tailwind"] },
  { title: "Project Website 2", description: "An interactive platform with dynamic content management.", image: websiteImg, tags: ["TypeScript", "API"] },
  { title: "Project Website 3", description: "E-commerce solution with seamless user experience.", image: websiteImg, tags: ["Fullstack", "DB"] },
  { title: "Project Website 4", description: "Portfolio and showcase website with custom animations.", image: websiteImg, tags: ["CSS", "Animation"] },
];

const games = [
  { title: "Dungeon Quest", description: "A top-down RPG dungeon crawler with procedural generation.", image: gameImg, tags: ["Unity", "C#"] },
  { title: "Pixel Runner", description: "A fast-paced endless runner with pixel art visuals.", image: gameImg, tags: ["Godot", "GDScript"] },
];

const apps = [
  { title: "Task Manager App", description: "A productivity app with intuitive task organization.", image: appImg, tags: ["Mobile", "Flutter"] },
  { title: "Weather Tracker", description: "Real-time weather tracking with beautiful visualizations.", image: appImg, tags: ["API", "React Native"] },
  { title: "Fitness Companion", description: "Workout tracking and health monitoring application.", image: appImg, tags: ["Mobile", "Firebase"] },
];

const designs = [
  { title: "Fantasy Landscape", description: "A vast fantasy landscape with aurora and mountains.", image: designImg, tags: ["Photoshop", "Digital Art"] },
  { title: "Character Design", description: "Original character concept with detailed shading.", image: designImg, tags: ["Photoshop", "Concept"] },
  { title: "UI Mockup", description: "Modern app interface design with dark theme.", image: designImg, tags: ["Photoshop", "UI/UX"] },
  { title: "Poster Design", description: "Event poster with retro-futuristic aesthetics.", image: designImg, tags: ["Photoshop", "Print"] },
  { title: "Logo Collection", description: "Brand identity designs with pixel art influence.", image: designImg, tags: ["Photoshop", "Branding"] },
  { title: "Photo Manipulation", description: "Surreal composite photography artwork.", image: designImg, tags: ["Photoshop", "Composite"] },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <PixelNav />
      <HeroSection />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <AboutSection />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <ProjectGrid id="websites" heading="// Websites" projects={websites} columns={2} />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <ProjectGrid id="games" heading="// Games" projects={games} columns={2} />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <ProjectGrid id="apps" heading="// Apps" projects={apps} columns={3} />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <ProjectGrid id="designs" heading="// Photoshop Designs" projects={designs} columns={3} />
      <hr className="pixel-divider max-w-5xl mx-auto" />
      <BlenderSection />
      <Footer />
    </div>
  );
};

export default Index;
