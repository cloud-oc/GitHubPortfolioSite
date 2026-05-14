import { describe, expect, it } from "vitest";
import { isAllowedAdmin, signSession, verifySession } from "./session";
import type { Env } from "./types";

const env = {
  ADMIN_GITHUB_LOGINS: "cloud-oc, another-admin"
} as Env;

describe("worker session", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({ login: "cloud-oc", exp: Date.now() + 60_000 }, "secret");
    const session = await verifySession(token, "secret");

    expect(session?.login).toBe("cloud-oc");
  });

  it("rejects tampered sessions", async () => {
    const token = await signSession({ login: "cloud-oc", exp: Date.now() + 60_000 }, "secret");
    const session = await verifySession(`${token}x`, "secret");

    expect(session).toBeNull();
  });

  it("checks admin allow-list case-insensitively", () => {
    expect(isAllowedAdmin("CLOUD-OC", env)).toBe(true);
    expect(isAllowedAdmin("visitor", env)).toBe(false);
  });
});
