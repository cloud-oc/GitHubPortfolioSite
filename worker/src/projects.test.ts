import { describe, expect, it } from "vitest";
import { buildProjectFiles } from "./projects";

describe("worker project file builder", () => {
  it("builds files for a new project", async () => {
    const form = new FormData();
    form.set("title", "New Project");
    form.set("subtitle", "A postcard");
    form.set("role", "Frontend");
    form.set("year", "2026");
    form.set("category", "Web");
    form.set("tags", JSON.stringify(["React", "GitHub"]));
    form.set("summary", "Summary");
    form.set("markdown", "## Details");
    form.set("coverImage", testFile("cover", "cover.png", "image/png"));
    form.set("heroImage", testFile("hero", "hero.jpg", "image/jpeg"));

    const result = await buildProjectFiles(form, []);

    expect(result.slug).toBe("new-project");
    expect(result.files.map((file) => file.path)).toEqual([
      "content/projects/new-project/cover.png",
      "content/projects/new-project/hero.jpg",
      "content/projects.json"
    ]);
  });

  it("updates an existing project without requiring new images", async () => {
    const form = new FormData();
    form.set("slug", "existing");
    form.set("title", "Existing");
    form.set("subtitle", "Updated");
    form.set("role", "Designer");
    form.set("year", "2026");
    form.set("category", "UI");
    form.set("tags", JSON.stringify(["Card"]));
    form.set("summary", "Summary");
    form.set("markdown", "## Updated");

    const result = await buildProjectFiles(form, [
      {
        id: "1",
        slug: "existing",
        title: "Old",
        subtitle: "Old",
        role: "Designer",
        year: "2025",
        category: "UI",
        tags: [],
        coverImage: "./content/projects/existing/cover.png",
        heroImage: "./content/projects/existing/hero.png",
        summary: "Old",
        markdown: "Old",
        gallery: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ]);

    expect(result.slug).toBe("existing");
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe("content/projects.json");
  });
});

function testFile(content: string, name: string, type: string) {
  const file = new File([content], name, { type });
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode(content).buffer
  });
  return file;
}
