import { expect, test } from "playwright/test";

// relative paths resolve under baseURL, which carries the basePath.

test.beforeEach(({ page }) => {
  // Any uncaught page error fails the test it happened in.
  page.on("pageerror", (error) => {
    throw error;
  });
});

test("home renders inside the app chrome", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("navigation").first()).toBeVisible();
  await expect(page).toHaveTitle(/\S/);
});

test("sidebar navigates to a page and marks it current", async ({ page }) => {
  await page.goto("./");
  const link = page.getByRole("link", { name: "Relatórios" });
  await link.click();
  await expect(page).toHaveURL(/\/apps\/template\/reports$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Relatórios" }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/^Relatórios/);
  await expect(link).toHaveAttribute("aria-current", "page");
});

test("a nested menu page is reachable through its folder", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Administração" }).click();
  await page.getByRole("link", { name: "Utilizadores" }).click();
  await expect(page).toHaveURL(/\/apps\/template\/admin\/users$/);
});

test("command palette opens with the shortcut and navigates", async ({
  page,
}) => {
  await page.goto("./");
  const dialog = page.getByRole("dialog");
  // The server-rendered page is visible before hydration attaches the shortcut
  // listener, so a single early press can be lost: retry until it opens.
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass();
  await dialog.getByRole("combobox").fill("Dashboard");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/apps\/template\/dashboard$/);
});

test("an unknown route shows the 404 page", async ({ page }) => {
  const response = await page.goto("./does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test.describe("preview mode has no login", () => {
  for (const path of ["login", "logout"]) {
    test(`/${path} redirects home`, async ({ page }) => {
      await page.goto(`./${path}`);
      await expect(page).toHaveURL(/\/apps\/template\/?$/);
    });
  }
});

test("health endpoint answers without a session", async ({ request }) => {
  const response = await request.get("./api/health", { maxRedirects: 0 });
  expect(response.status()).toBe(200);
});
