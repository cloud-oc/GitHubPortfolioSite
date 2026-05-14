import { clearCookie, corsHeaders, errorResponse, getCookie, json, makeCookie, redirect } from "./http";
import { exchangeCodeForToken, fetchGitHubUser } from "./github";
import { commitProjectForm, deleteProject } from "./projects";
import { getSessionFromRequest, isAllowedAdmin, signSession } from "./session";
import type { Env } from "./types";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/auth/github/start" && request.method === "GET") {
        return startOAuth(request, env);
      }
      if (url.pathname === "/auth/github/callback" && request.method === "GET") {
        return handleOAuthCallback(request, env);
      }
      if (url.pathname === "/api/session" && request.method === "GET") {
        return handleSession(request, env);
      }
      if (url.pathname === "/api/logout" && request.method === "POST") {
        return json(
          { ok: true },
          {
            headers: {
              "Set-Cookie": clearCookie("portfolio_session")
            }
          },
          env
        );
      }
      if (url.pathname === "/api/projects" && request.method === "POST") {
        return requireAdmin(request, env, async () => {
          const form = await request.formData();
          return json(await commitProjectForm(env, form), {}, env);
        });
      }
      if (url.pathname.startsWith("/api/projects/") && request.method === "DELETE") {
        return requireAdmin(request, env, async () => {
          const slug = decodeURIComponent(url.pathname.replace("/api/projects/", ""));
          return json(await deleteProject(env, slug), {}, env);
        });
      }

      return errorResponse("Not found.", 404, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected worker error.";
      return errorResponse(message, 500, env);
    }
  }
};

function startOAuth(request: Request, env: Env) {
  const state = crypto.randomUUID();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", new URL("/auth/github/callback", request.url).toString());
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  return redirect(url.toString(), {
    "Set-Cookie": makeCookie("portfolio_oauth_state", state, 600)
  });
}

async function handleOAuthCallback(request: Request, env: Env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = getCookie(request, "portfolio_oauth_state");

  if (!code || !state || state !== expectedState) {
    return redirect(`${env.SITE_ORIGIN}/#/admin?auth=failed`, {
      "Set-Cookie": clearCookie("portfolio_oauth_state")
    });
  }

  const token = await exchangeCodeForToken(code, request, env);
  const user = await fetchGitHubUser(token);
  if (!isAllowedAdmin(user.login, env)) {
    return redirect(`${env.SITE_ORIGIN}/#/admin?auth=denied`, {
      "Set-Cookie": clearCookie("portfolio_oauth_state")
    });
  }

  const session = await signSession(
    {
      login: user.login,
      avatarUrl: user.avatar_url,
      exp: Date.now() + SESSION_MAX_AGE * 1000
    },
    env.SESSION_SECRET
  );

  const headers = new Headers({ Location: `${env.SITE_ORIGIN}/#/admin` });
  headers.append("Set-Cookie", makeCookie("portfolio_session", session, SESSION_MAX_AGE));
  headers.append("Set-Cookie", clearCookie("portfolio_oauth_state"));
  return new Response(null, { status: 302, headers });
}

async function handleSession(request: Request, env: Env) {
  const session = await getSessionFromRequest(request, env);
  if (!session || !isAllowedAdmin(session.login, env)) {
    return errorResponse("Unauthorized.", 401, env);
  }
  return json(
    {
      isAdmin: true,
      login: session.login,
      avatarUrl: session.avatarUrl
    },
    {},
    env
  );
}

async function requireAdmin(request: Request, env: Env, handler: () => Promise<Response>) {
  const session = await getSessionFromRequest(request, env);
  if (!session || !isAllowedAdmin(session.login, env)) {
    return errorResponse("Unauthorized.", 401, env);
  }
  return handler();
}
