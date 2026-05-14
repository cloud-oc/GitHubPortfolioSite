import { ADMIN_API_BASE } from "../config";
import type { ProjectInput } from "../types";

export type SessionResponse = {
  isAdmin: boolean;
  login: string;
  avatarUrl?: string;
};

function assertApiBase() {
  if (!ADMIN_API_BASE) {
    throw new Error("VITE_ADMIN_API_BASE is not configured.");
  }
}

export async function fetchSession(): Promise<SessionResponse | null> {
  if (!ADMIN_API_BASE) {
    return null;
  }

  const response = await fetch(`${ADMIN_API_BASE}/api/session`, {
    credentials: "include"
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load admin session.");
  }

  return response.json();
}

export function startLogin() {
  assertApiBase();
  window.location.href = `${ADMIN_API_BASE}/auth/github/start`;
}

export async function logout() {
  assertApiBase();
  await fetch(`${ADMIN_API_BASE}/api/logout`, {
    method: "POST",
    credentials: "include"
  });
}

export async function saveProject(input: ProjectInput, slug?: string) {
  assertApiBase();
  const body = new FormData();
  body.set("title", input.title);
  body.set("subtitle", input.subtitle);
  body.set("role", input.role);
  body.set("year", input.year);
  body.set("category", input.category);
  body.set("tags", JSON.stringify(input.tags));
  body.set("summary", input.summary);
  body.set("markdown", input.markdown);
  if (slug) {
    body.set("slug", slug);
  }
  if (input.coverImage) {
    body.set("coverImage", input.coverImage);
  }
  if (input.heroImage) {
    body.set("heroImage", input.heroImage);
  }
  input.galleryImages.forEach((file) => body.append("galleryImages", file));

  const response = await fetch(`${ADMIN_API_BASE}/api/projects`, {
    method: "POST",
    credentials: "include",
    body
  });

  if (!response.ok) {
    throw new Error(await readError(response, "保存作品失败。"));
  }

  return response.json();
}

export async function deleteProject(slug: string) {
  assertApiBase();
  const response = await fetch(`${ADMIN_API_BASE}/api/projects/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(await readError(response, "删除作品失败。"));
  }
}

async function readError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}
