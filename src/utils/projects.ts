import type { Project, ProjectInput } from "../types";

const PROJECT_REQUIRED_FIELDS: Array<keyof Project> = [
  "id",
  "slug",
  "title",
  "subtitle",
  "role",
  "year",
  "category",
  "tags",
  "coverImage",
  "heroImage",
  "summary",
  "markdown",
  "gallery",
  "createdAt",
  "updatedAt"
];

export function validateProject(value: unknown): Project {
  if (!value || typeof value !== "object") {
    throw new Error("Project must be an object.");
  }

  const candidate = value as Record<string, unknown>;
  for (const field of PROJECT_REQUIRED_FIELDS) {
    if (!(field in candidate)) {
      throw new Error(`Project is missing "${field}".`);
    }
  }

  if (!Array.isArray(candidate.tags) || !candidate.tags.every((tag) => typeof tag === "string")) {
    throw new Error("Project tags must be a string array.");
  }

  if (!Array.isArray(candidate.gallery) || !candidate.gallery.every((item) => typeof item === "string")) {
    throw new Error("Project gallery must be a string array.");
  }

  for (const field of PROJECT_REQUIRED_FIELDS.filter((field) => field !== "tags" && field !== "gallery")) {
    if (typeof candidate[field] !== "string") {
      throw new Error(`Project "${field}" must be a string.`);
    }
  }

  return candidate as Project;
}

export function validateProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) {
    throw new Error("Projects payload must be an array.");
  }

  return value.map(validateProject);
}

export function slugify(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || `project-${Date.now()}`;
}

export function createEmptyInput(): ProjectInput {
  return {
    title: "",
    subtitle: "",
    role: "",
    year: new Date().getFullYear().toString(),
    category: "",
    tags: [],
    summary: "",
    markdown: "",
    galleryImages: []
  };
}

export function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function imageToObjectUrl(file?: File) {
  return file ? URL.createObjectURL(file) : "";
}
