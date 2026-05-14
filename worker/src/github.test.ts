import { describe, expect, it } from "vitest";
import { makeTreeItem, redirectUri } from "./github";

describe("github helpers", () => {
  it("creates tree items from blob shas", () => {
    expect(makeTreeItem("public/content/projects.json", "abc123")).toEqual({
      path: "public/content/projects.json",
      mode: "100644",
      type: "blob",
      sha: "abc123"
    });
  });

  it("derives the OAuth callback from the worker origin", () => {
    expect(redirectUri(new Request("https://api.example.com/auth/github/callback"))).toBe(
      "https://api.example.com/auth/github/callback"
    );
  });
});
