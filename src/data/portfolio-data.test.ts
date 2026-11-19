import { describe, expect, it } from "vitest";
import {
  certificates,
  education,
  experience,
  personalInfo,
  projects,
  repos,
  skills,
  townBuildings,
} from "./portfolio-data";

describe("portfolio-data", () => {
  it("defines all 8 expected town buildings with unique IDs", () => {
    const ids = townBuildings.map((b) => b.id);
    expect(ids).toEqual([
      "gate",
      "tavern",
      "questboard",
      "wizard",
      "gallery",
      "forge",
      "noticeboard",
      "exit",
    ]);
    expect(new Set(ids).size).toBe(8);
  });

  it("includes valid personal links and non-empty resume sections", () => {
    expect(personalInfo.name).toBeTruthy();
    expect(personalInfo.email).toContain("@");
    expect(personalInfo.github).toMatch(/^https:\/\/github\.com\//);
    expect(personalInfo.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\//);
    expect(personalInfo.resumePdf).toBe("Shealtiel-Masangkay-Resume.pdf");

    expect(education.length).toBe(2);
    expect(education[0].details).toContain("Data Structures");
    expect(experience.length).toBeGreaterThan(0);
    expect(projects.length).toBe(5);
    for (const proj of projects) {
      expect(proj.highlights.length).toBeGreaterThanOrEqual(2);
    }
    expect(repos.length).toBeGreaterThan(0);
    expect(certificates.length).toBeGreaterThan(0);
    for (const cert of certificates) {
      expect(cert.summary).toBeTruthy();
      expect(cert.verifyUrl).toMatch(/^https:\/\/www\.linkedin\.com\//);
    }
    expect(skills.intermediate.length).toBeGreaterThan(0);
    expect(skills.beginner.length).toBeGreaterThan(0);
    expect(skills.tools.length).toBeGreaterThan(0);
  });

  it("gives every repository a valid https URL and at least one tag", () => {
    for (const repo of repos) {
      expect(repo.href).toMatch(/^https:\/\/github\.com\//);
      expect(repo.tags.length).toBeGreaterThan(0);
    }
  });
});
