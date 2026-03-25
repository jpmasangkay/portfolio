import heroBanner from "@/assets/hero-banner.jpg";
import { useParallax } from "@/hooks/use-parallax";

const HeroSection = () => {
  const { ref, offset } = useParallax(0.4);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url(${heroBanner})`,
          transform: `translateY(${offset * 0.5}px) scale(1.1)`,
        }}
      />
      <div className="absolute inset-0 bg-background/70" />
      <div
        className="relative z-10 text-center px-4 max-w-3xl mx-auto transition-opacity duration-300"
        style={{
          transform: `translateY(${offset * 0.15}px)`,
          opacity: Math.max(0, 1 - Math.abs(offset) / 600),
        }}
      >
        <p className="stat-pixel mb-4 tracking-widest">WELCOME TO MY WORLD</p>
        <h1 className="font-pixel text-2xl md:text-4xl text-foreground leading-relaxed mb-6">
          Shealtiel John Paul A. Masangkay
        </h1>
        <p className="font-body text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
          Developer · Designer · Creator
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="#about" className="pixel-btn">
            View Quest Log
          </a>
          <a
            href="#websites"
            className="pixel-btn"
            style={{
              background: "hsl(var(--secondary))",
              color: "hsl(var(--foreground))",
              borderColor: "hsl(var(--border))",
            }}
          >
            See Projects
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
