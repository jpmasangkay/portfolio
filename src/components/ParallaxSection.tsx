import { ReactNode } from "react";
import { useScrollReveal } from "@/hooks/use-parallax";

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const ParallaxSection = ({ children, className = "", delay = 0 }: ParallaxSectionProps) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default ParallaxSection;
