import { Briefcase, Code, GraduationCap, MapPin, User, Award } from "lucide-react";
import ParallaxSection from "./ParallaxSection";

const stats = [
  { icon: User, label: "Name", value: "Shealtiel John Paul A. Masangkay" },
  { icon: Briefcase, label: "Target", value: "OJT — Software/Web Development" },
  { icon: GraduationCap, label: "Education", value: "BS Computer Science — Sacred Heart College of Lucena City, Inc. (2023–Present)" },
  { icon: MapPin, label: "Location", value: "Lucena City, Philippines" },
];

const experience = [
  "Junior Web Developer (Part-time) — Leon Guinto Memorial College, Inc. (Jan 2026–Present)",
  "Built student information system features in PHP and MySQL (Hostinger).",
  "Implemented multi-copy PDF export using TCPDF for registrar/accounting/student records.",
  "Refactored the student dashboard UI and co-developed role-based registrar interfaces (admin, clerk, superadmin).",
];

const skills = [
  "Intermediate: TypeScript, React, C++, Git",
  "Beginner: PHP, Laravel, Java, MERN, SQL, Unity/C#, Kotlin, Flutter",
  "Tools: Blender, Photoshop, VS Code, Android Studio",
];

const certificates = [
  "Gemini Certified — Google (2026)",
  "Hour of Code (Minecraft) — Microsoft (2026)",
  "Trademark Awareness Session — Ateneo (2026)",
];

const AboutSection = () => {
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <ParallaxSection>
          <h2 className="section-heading mb-12">// Character Stats</h2>
        </ParallaxSection>

        <ParallaxSection delay={0}>
          <p className="font-body text-muted-foreground mb-10">
            Computer Science student seeking an OJT placement in software or web development.
          </p>
        </ParallaxSection>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
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

        <div className="grid md:grid-cols-3 gap-6">
          <ParallaxSection delay={0}>
            <div className="pixel-card p-6 h-full">
              <Briefcase size={20} className="text-accent mb-3" />
              <p className="stat-pixel mb-4">Experience</p>
              <ul className="space-y-2">
                {experience.map((item, i) => (
                  <li key={i} className="font-body text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-pixel text-[8px] mt-1.5">►</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ParallaxSection>

          <ParallaxSection delay={150}>
            <div className="pixel-card p-6 h-full">
              <Code size={20} className="text-primary mb-3" />
              <p className="stat-pixel mb-4">Skills</p>
              <ul className="space-y-2">
                {skills.map((item, i) => (
                  <li key={i} className="font-body text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-pixel text-[8px] mt-1.5">★</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ParallaxSection>

          <ParallaxSection delay={300}>
            <div className="pixel-card p-6 h-full">
              <Award size={20} className="text-accent mb-3" />
              <p className="stat-pixel mb-4">Certificates</p>
              <ul className="space-y-2">
                {certificates.map((item, i) => (
                  <li key={i} className="font-body text-muted-foreground flex items-start gap-2">
                    <span className="text-primary font-pixel text-[8px] mt-1.5">✦</span>
                    {item}
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
