import wallowsPoster from "@/assets/photoshop-wallows.png";
import nexonPoster from "@/assets/photoshop-nexon.png";
import magazineFrontBack from "@/assets/magazine-front-back.png";
import magazinePages1to6 from "@/assets/magazine-pages-1-6.png";
import magazinePages2to5 from "@/assets/magazine-pages-2-5.png";
import magazinePages3to4 from "@/assets/magazine-pages-3-4.png";
import ParallaxSection from "./ParallaxSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const posters = [
  {
    title: "Wallows Tour Poster",
    description:
      "Event-style poster layout with bold typography, high-contrast photo cutout, and textured background.",
    image: wallowsPoster,
    tags: ["Photoshop", "Poster", "Typography"],
  },
  {
    title: "Nexon Product Ad",
    description:
      "Gaming product advertisement composition using layered imagery, angled panels, and brand-forward callouts.",
    image: nexonPoster,
    tags: ["Photoshop", "Advertising", "Composition"],
  },
];

const magazineSpreads = [
  {
    title: "Front & Back Cover",
    image: magazineFrontBack,
  },
  {
    title: "Pages 1–6",
    image: magazinePages1to6,
  },
  {
    title: "Pages 2–5",
    image: magazinePages2to5,
  },
  {
    title: "Pages 3–4",
    image: magazinePages3to4,
  },
];

const PhotoshopSection = () => {
  return (
    <section id="photoshop" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ParallaxSection>
          <h2 className="section-heading mb-12">// Photoshop</h2>
        </ParallaxSection>

        <div className="grid md:grid-cols-2 gap-6">
          {posters.map((work, i) => (
            <ParallaxSection key={work.title} delay={i * 100}>
              <div className="pixel-card overflow-hidden group h-full flex flex-col">
                <div className="aspect-[4/5] overflow-hidden bg-secondary/30 p-3">
                  <img
                    src={work.image}
                    alt={work.title}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-pixel text-[10px] text-foreground mb-2 leading-relaxed">
                    {work.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mb-3">
                    {work.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {work.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[10px] px-2 py-1 bg-secondary text-muted-foreground border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </ParallaxSection>
          ))}
        </div>

        <ParallaxSection delay={300}>
          <div className="mt-12">
            <h3 className="font-pixel text-xs text-foreground mb-4 leading-relaxed">
              // Magazine Spreads
            </h3>

            <div className="hidden md:grid grid-cols-1 gap-6">
              {magazineSpreads.map((spread, i) => (
                <ParallaxSection key={spread.title} delay={400 + i * 100}>
                  <div className="pixel-card overflow-hidden">
                    <div className="aspect-[16/9] bg-secondary/30 p-3">
                      <img
                        src={spread.image}
                        alt={spread.title}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-mono text-[10px] text-muted-foreground">{spread.title}</p>
                    </div>
                  </div>
                </ParallaxSection>
              ))}
            </div>

            <div className="md:hidden">
              <Carousel opts={{ align: "start" }}>
                <CarouselContent>
                  {magazineSpreads.map((spread) => (
                    <CarouselItem key={spread.title}>
                      <div className="pixel-card overflow-hidden">
                        <div className="aspect-[16/10] bg-secondary/30 p-3">
                          <img
                            src={spread.image}
                            alt={spread.title}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-4">
                          <p className="font-mono text-[10px] text-muted-foreground">{spread.title}</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-2" />
                <CarouselNext className="-right-2" />
              </Carousel>
            </div>
          </div>
        </ParallaxSection>
      </div>
    </section>
  );
};

export default PhotoshopSection;

