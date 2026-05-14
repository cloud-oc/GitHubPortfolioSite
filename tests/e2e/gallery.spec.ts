import { expect, test } from "@playwright/test";

test("gallery opens a postcard and flips to markdown back", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /终末地潜能卡片/i })).toBeVisible();

  await page.getByRole("button", { name: /终末地潜能卡片/i }).click();
  await expect(page.locator("h1", { hasText: "终末地潜能卡片" })).toBeVisible();
  await expect(page.getByLabel("作品目录进度")).toContainText("01 / 03");

  await page.getByRole("button", { name: "下一个作品" }).click();
  await expect(page.locator("h1", { hasText: "录像及截图式网格" })).toBeVisible();
  await expect(page.getByLabel("作品目录进度")).toContainText("02 / 03");

  await page.getByRole("button", { name: "翻到背面" }).click();
  await expect(page.getByRole("heading", { name: "设计目标" })).toBeVisible();
  await expect(page.getByText("首页参考截图管理器的密集网格")).toBeVisible();
});

test("admin page shows GitHub login when signed out", async ({ page }) => {
  await page.goto("/#/admin");
  await expect(page.getByRole("heading", { name: "作品管理" })).toBeVisible();
  await expect(page.getByRole("button", { name: /使用 GitHub 登录/i })).toBeVisible();
});
