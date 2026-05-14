import { slugify, validateProjects } from "../../src/utils/projects";
import type { Env, GitHubBlobWrite, CommitProjectResult } from "./types";
import { commitFiles, GitHubApiError } from "./github";

type ExistingProject = ReturnType<typeof validateProjects>[number];

export async function buildProjectFiles(form: FormData, existingProjects: ExistingProject[]) {
  const now = new Date().toISOString();
  const requestedSlug = readString(form, "slug");
  const current = requestedSlug ? existingProjects.find((project) => project.slug === requestedSlug) : undefined;
  const title = readRequiredString(form, "title");
  const slug = current?.slug ?? uniqueSlug(slugify(title), existingProjects);
  const basePath = `content/projects/${slug}`;
  const tags = parseTags(readString(form, "tags"));
  const galleryFiles = form.getAll("galleryImages").filter((item): item is File => item instanceof File && item.size > 0);
  const coverFile = fileOrUndefined(form.get("coverImage"));
  const heroFile = fileOrUndefined(form.get("heroImage"));
  const markdown = readRequiredString(form, "markdown");
  const galleryPaths = [...(current?.gallery ?? [])];
  const files: GitHubBlobWrite[] = [];

  if (!coverFile && !current) {
    throw new Error("新增作品需要封面图。");
  }
  if (!heroFile && !current) {
    throw new Error("新增作品需要明信片主图。");
  }

  const coverImage = coverFile ? `${basePath}/cover${extensionFromFile(coverFile)}` : current?.coverImage.replace(/^\.\//, "") ?? "";
  const heroImage = heroFile ? `${basePath}/hero${extensionFromFile(heroFile)}` : current?.heroImage.replace(/^\.\//, "") ?? "";

  if (coverFile) {
    files.push({ path: coverImage, content: await fileToBase64(coverFile), encoding: "base64" });
  }
  if (heroFile) {
    files.push({ path: heroImage, content: await fileToBase64(heroFile), encoding: "base64" });
  }

  for (const [index, file] of galleryFiles.entries()) {
    const path = `${basePath}/gallery-${Date.now()}-${index + 1}${extensionFromFile(file)}`;
    galleryPaths.push(`./${path}`);
    files.push({ path, content: await fileToBase64(file), encoding: "base64" });
  }

  const nextProject: ExistingProject = {
    id: current?.id ?? crypto.randomUUID(),
    slug,
    title,
    subtitle: readRequiredString(form, "subtitle"),
    role: readRequiredString(form, "role"),
    year: readRequiredString(form, "year"),
    category: readRequiredString(form, "category"),
    tags,
    coverImage: `./${coverImage}`,
    heroImage: `./${heroImage}`,
    summary: readRequiredString(form, "summary"),
    markdown,
    gallery: galleryPaths,
    createdAt: current?.createdAt ?? now,
    updatedAt: now
  };

  const nextProjects = current
    ? existingProjects.map((project) => (project.slug === current.slug ? nextProject : project))
    : [nextProject, ...existingProjects];

  files.push({
    path: "content/projects.json",
    content: `${JSON.stringify(nextProjects, null, 2)}\n`
  });

  return { slug, files };
}

export async function commitProjectForm(env: Env, form: FormData): Promise<CommitProjectResult> {
  const existingProjects = await fetchProjects(env);
  const { slug, files } = await buildProjectFiles(form, existingProjects);
  const commitSha = await commitWithRetry(env, files, `chore(content): update ${slug}`);
  return { slug, commitSha, files: files.map((file) => file.path) };
}

export async function deleteProject(env: Env, slug: string) {
  const existingProjects = await fetchProjects(env);
  const current = existingProjects.find((project) => project.slug === slug);
  if (!current) {
    throw new Error("作品不存在。");
  }

  const nextProjects = existingProjects.filter((project) => project.slug !== slug);
  const commitSha = await commitWithRetry(
    env,
    [
      {
        path: "content/projects.json",
        content: `${JSON.stringify(nextProjects, null, 2)}\n`
      }
    ],
    `chore(content): delete ${slug}`
  );

  return { slug, commitSha };
}

async function fetchProjects(env: Env) {
  const url = `https://raw.githubusercontent.com/${env.REPO_OWNER}/${env.REPO_NAME}/${env.REPO_BRANCH}/public/content/projects.json`;
  const response = await fetch(`${url}?cacheBust=${Date.now()}`, {
    headers: { Accept: "application/json" }
  });

  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new Error("无法读取仓库中的 projects.json。");
  }

  return validateProjects(await response.json());
}

async function commitWithRetry(env: Env, files: GitHubBlobWrite[], message: string) {
  try {
    return await commitFiles(env, withPublicPrefix(files), message);
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 409) {
      return commitFiles(env, withPublicPrefix(files), message);
    }
    throw error;
  }
}

function withPublicPrefix(files: GitHubBlobWrite[]) {
  return files.map((file) => ({ ...file, path: `public/${file.path}` }));
}

function uniqueSlug(base: string, projects: ExistingProject[]) {
  const used = new Set(projects.map((project) => project.slug));
  if (!used.has(base)) {
    return base;
  }
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }
  return `${base}-${Date.now()}`;
}

function readString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readRequiredString(form: FormData, key: string) {
  const value = readString(form, key);
  if (!value) {
    throw new Error(`${key} 不能为空。`);
  }
  return value;
}

function parseTags(value: string) {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function fileOrUndefined(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : undefined;
}

function extensionFromFile(file: File) {
  const filenameExtension = file.name.match(/\.[a-z0-9]+$/i)?.[0];
  if (filenameExtension) {
    return filenameExtension.toLowerCase();
  }
  const mimeExtension = file.type.split("/")[1];
  return mimeExtension ? `.${mimeExtension.replace("jpeg", "jpg")}` : ".bin";
}

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await fileToArrayBuffer(file));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function fileToArrayBuffer(file: File) {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }

  if (typeof file.text === "function") {
    return new TextEncoder().encode(await file.text()).buffer;
  }

  throw new Error("当前运行环境无法读取上传文件。");
}
