import { describe, expect, it } from "vitest";
import { slugify, validateProjects } from "./projects";

describe("project utilities", () => {
  it("validates a complete project payload", () => {
    const projects = validateProjects([
      {
        id: "1",
        slug: "sample",
        title: "Sample",
        subtitle: "Subtitle",
        role: "Designer",
        year: "2026",
        category: "UI",
        tags: ["Card"],
        coverImage: "./cover.svg",
        heroImage: "./hero.svg",
        summary: "Summary",
        markdown: "## Details",
        gallery: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ]);

    expect(projects).toHaveLength(1);
    expect(projects[0].slug).toBe("sample");
  });

  it("rejects an invalid project payload", () => {
    expect(() => validateProjects([{ title: "Missing fields" }])).toThrow(/missing/i);
  });

  it("creates readable slugs", () => {
    expect(slugify("Orbit Notes: UI / CMS")).toBe("orbit-notes-ui-cms");
    expect(slugify("终末地 潜能卡片")).toBe("终末地-潜能卡片");
  });
});
