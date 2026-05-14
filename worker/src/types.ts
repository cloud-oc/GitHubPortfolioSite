export type Env = {
  SITE_ORIGIN: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_WRITER_TOKEN: string;
  ADMIN_GITHUB_LOGINS: string;
  SESSION_SECRET: string;
  REPO_OWNER: string;
  REPO_NAME: string;
  REPO_BRANCH: string;
};

export type GitHubUser = {
  login: string;
  avatar_url?: string;
};

export type SessionPayload = {
  login: string;
  avatarUrl?: string;
  exp: number;
};

export type GitHubBlobWrite = {
  path: string;
  content: string;
  encoding?: "utf-8" | "base64";
};

export type GitHubTreeItem = {
  path: string;
  mode: "100644";
  type: "blob";
  sha: string;
};

export type CommitProjectResult = {
  slug: string;
  commitSha: string;
  files: string[];
};
