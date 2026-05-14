import type { Env, GitHubBlobWrite, GitHubTreeItem, GitHubUser } from "./types";

const GITHUB_API = "https://api.github.com";

export async function exchangeCodeForToken(code: string, request: Request, env: Env) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri(request)
    })
  });

  if (!response.ok) {
    throw new Error("GitHub OAuth token exchange failed.");
  }

  const payload = (await response.json()) as { access_token?: string; error_description?: string };
  if (!payload.access_token) {
    throw new Error(payload.error_description ?? "GitHub OAuth did not return an access token.");
  }

  return payload.access_token;
}

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API}/user`, {
    headers: githubHeaders(token)
  });
  if (!response.ok) {
    throw new Error("Unable to fetch GitHub user.");
  }
  return response.json();
}

export async function commitFiles(env: Env, files: GitHubBlobWrite[], message: string) {
  const owner = env.REPO_OWNER;
  const repo = env.REPO_NAME;
  const branch = env.REPO_BRANCH;

  const ref = await githubJson<{ object: { sha: string } }>(
    env,
    `/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { method: "GET" }
  );
  const baseCommitSha = ref.object.sha;
  const baseCommit = await githubJson<{ tree: { sha: string } }>(
    env,
    `/repos/${owner}/${repo}/git/commits/${baseCommitSha}`,
    { method: "GET" }
  );
  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = await githubJson<{ sha: string }>(env, `/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({
          content: file.content,
          encoding: file.encoding ?? "utf-8"
        })
      });
      return makeTreeItem(file.path, blob.sha);
    })
  );

  const tree = await githubJson<{ sha: string }>(env, `/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: blobs
    })
  });

  const commit = await githubJson<{ sha: string }>(env, `/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [baseCommitSha]
    })
  });

  await githubJson(env, `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({
      sha: commit.sha,
      force: false
    })
  });

  return commit.sha;

  async function githubJson<T>(envForRequest: Env, path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${GITHUB_API}${path}`, {
      ...init,
      headers: {
        ...githubHeaders(envForRequest.GITHUB_WRITER_TOKEN),
        "Content-Type": "application/json",
        ...init.headers
      }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new GitHubApiError(response.status, text);
    }
    return response.json() as Promise<T>;
  }
}

export function makeTreeItem(path: string, sha: string): GitHubTreeItem {
  return {
    path,
    mode: "100644",
    type: "blob",
    sha
  };
}

export class GitHubApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export function redirectUri(request: Request) {
  const url = new URL(request.url);
  return `${url.origin}/auth/github/callback`;
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "GitHubPortfolioSite-Worker",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}
