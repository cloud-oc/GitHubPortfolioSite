export type Project = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  year: string;
  category: string;
  tags: string[];
  coverImage: string;
  heroImage: string;
  summary: string;
  markdown: string;
  gallery: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectsState = {
  projects: Project[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  refresh: () => Promise<void>;
};

export type AdminSession = {
  isAdmin: boolean;
  login: string;
  avatarUrl?: string;
};

export type SessionState = {
  session: AdminSession | null;
  status: "idle" | "loading" | "ready" | "error";
  refresh: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
};

export type ProjectInput = {
  title: string;
  subtitle: string;
  role: string;
  year: string;
  category: string;
  tags: string[];
  summary: string;
  markdown: string;
  coverImage?: File;
  heroImage?: File;
  galleryImages: File[];
};
