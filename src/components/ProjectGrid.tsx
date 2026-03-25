import ParallaxSection from "./ParallaxSection";

interface Project {
  title: string;
  description: string;
  image?: string;
  href?: string;
  tags: string[];
}

interface ProjectGridProps {
  id: string;
  heading: string;
  projects: Project[];
  columns?: 2 | 3;
}

const ProjectGrid = ({ id, heading, projects, columns = 3 }: ProjectGridProps) => {
  const gridCols = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";

  return (
    <section id={id} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ParallaxSection>
          <h2 className="section-heading mb-12">{heading}</h2>
        </ParallaxSection>
        <div className={`grid sm:grid-cols-2 ${gridCols} gap-6`}>
          {projects.map((project, i) => (
            <ParallaxSection key={i} delay={i * 100}>
              <div className="pixel-card overflow-hidden group h-full flex flex-col">
                {project.image ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="border-b-2 border-border bg-secondary/40 p-4">
                    <p className="font-mono text-[10px] text-muted-foreground">GitHub Repository</p>
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-pixel text-[10px] text-foreground mb-2 leading-relaxed">
                    {project.title}
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mb-3">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[10px] px-2 py-1 bg-secondary text-muted-foreground border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {project.href ? (
                    <div className="mt-4">
                      <a
                        href={project.href}
                        target="_blank"
                        rel="noreferrer"
                        className="pixel-btn inline-block"
                        style={{
                          background: "hsl(var(--secondary))",
                          color: "hsl(var(--foreground))",
                          borderColor: "hsl(var(--border))",
                        }}
                      >
                        View on GitHub
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            </ParallaxSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectGrid;
