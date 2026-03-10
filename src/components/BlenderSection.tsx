import tavernImage from "@/assets/blender-tavern.jpg";
import ParallaxSection from "./ParallaxSection";

const BlenderSection = () => {
  return (
    <section id="blender" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ParallaxSection>
          <h2 className="section-heading mb-12">// 3D Renders</h2>
        </ParallaxSection>
        <ParallaxSection delay={100}>
          <div className="pixel-card overflow-hidden max-w-3xl mx-auto group">
            <div className="aspect-video overflow-hidden">
              <img
                src={tavernImage}
                alt="Medieval Tavern - Blender 3D Render"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="p-6">
              <h3 className="font-pixel text-xs text-foreground mb-2 leading-relaxed">
                Medieval Tavern
              </h3>
              <p className="font-body text-muted-foreground mb-3">
                A cozy medieval tavern scene rendered in Blender, featuring warm candlelight, 
                wooden furniture, and atmospheric stone interiors.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="font-mono text-[10px] px-2 py-1 bg-secondary text-muted-foreground border border-border">
                  Blender
                </span>
                <span className="font-mono text-[10px] px-2 py-1 bg-secondary text-muted-foreground border border-border">
                  3D Modeling
                </span>
                <span className="font-mono text-[10px] px-2 py-1 bg-secondary text-muted-foreground border border-border">
                  Lighting
                </span>
              </div>
            </div>
          </div>
        </ParallaxSection>
      </div>
    </section>
  );
};

export default BlenderSection;
