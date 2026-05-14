import { expect, test } from "@playwright/test";

test("gallery opens a postcard and flips to markdown back", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /终末地潜能卡片/i })).toBeVisible();

  await page.getByRole("button", { name: /终末地潜能卡片/i }).click();
  await expect(page.locator("h1", { hasText: "终末地潜能卡片" })).toBeVisible();

  await page.getByRole("button", { name: "翻到背面" }).click();
  await expect(page.getByRole("heading", { name: "项目说明" })).toBeVisible();
  await expect(page.getByText("管理员登录后可以从右上角加号新增作品")).toBeVisible();
});

test("admin page shows GitHub login when signed out", async ({ page }) => {
  await page.goto("/#/admin");
  await expect(page.getByRole("heading", { name: "作品管理" })).toBeVisible();
  await expect(page.getByRole("button", { name: /使用 GitHub 登录/i })).toBeVisible();
});
