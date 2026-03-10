import { User, GraduationCap, Award, BookOpen } from "lucide-react";
import ParallaxSection from "./ParallaxSection";

const stats = [
  { icon: User, label: "Name", value: "[Your Name]" },
  { icon: User, label: "Age", value: "[Your Age]" },
  { icon: GraduationCap, label: "Education", value: "[Your Degree / School]" },
];

const seminars = [
  "Seminar Title 1",
  "Seminar Title 2",
  "Seminar Title 3",
];

const achievements = [
  "Achievement 1",
  "Achievement 2",
  "Achievement 3",
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ParallaxSection>
          <h2 className="section-heading mb-12">// Character Stats</h2>
        </ParallaxSection>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <ParallaxSection key={stat.label} delay={i * 100}>
              <div className="pixel-card p-6 h-full">
                <stat.icon size={20} className="text-primary mb-3" />
                <p className="stat-pixel mb-2">{stat.label}</p>
                <p className="font-body text-foreground">{stat.value}</p>
              </div>
            </ParallaxSection>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ParallaxSection delay={0}>
            <div className="pixel-card p-6 h-full">
              <BookOpen size={20} className="text-accent mb-3" />
              <p className="stat-pixel mb-4">Seminars</p>
              <ul className="space-y-2">
                {seminars.map((s, i) => (
                  <li key={i} className="font-body text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-pixel text-[8px] mt-1.5">►</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </ParallaxSection>

          <ParallaxSection delay={150}>
            <div className="pixel-card p-6 h-full">
              <Award size={20} className="text-primary mb-3" />
              <p className="stat-pixel mb-4">Achievements</p>
              <ul className="space-y-2">
                {achievements.map((a, i) => (
                  <li key={i} className="font-body text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-pixel text-[8px] mt-1.5">★</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </ParallaxSection>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
