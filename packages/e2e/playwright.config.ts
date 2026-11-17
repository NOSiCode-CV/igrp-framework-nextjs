import { defineConfig, devices } from "playwright/test";

// Smoke tests against demo-v1 in preview mode, so no IdP or Access Management
// is needed. That means `next dev`: production builds refuse the auth bypass.
// The template's default basePath is kept on purpose — it is the configuration
// that breaks redirects and links when something builds URLs wrongly.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_PATH = "/apps/template";

export default defineConfig({
  testDir: "./tests",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // One dev server compiles each route on first hit; parallel workers only race it.
  workers: 1,
  reporter: process.env.CI ? [["list"], ["junit", { outputFile: "results/junit.xml" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}/`,
    trace: "retain-on-failure",
  },
  // First compile of a route under Turbopack can take a while.
  expect: { timeout: 15_000 },
  timeout: 60_000,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // E2E_CHANNEL=msedge (or chrome) runs an installed browser instead of
        // Playwright's own, when `playwright install` hasn't been run.
        channel: process.env.E2E_CHANNEL || undefined,
      },
    },
  ],
  webServer: {
    command: `pnpm --filter @igrp/framework-next-template dev --port ${PORT}`,
    url: `http://localhost:${PORT}${BASE_PATH}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // The shell wins over templates/demo-v1/.env, so a local .env can stay as is.
    env: {
      IGRP_PREVIEW_MODE: "true",
      AUTH_PROVIDER: "none",
      NEXT_PUBLIC_BASE_PATH: BASE_PATH,
      // Redirects take their public origin from here, so it must name this port.
      NEXTAUTH_URL: `http://localhost:${PORT}${BASE_PATH}/api/auth`,
      IGRP_SYNC_ACCESS: "false",
      IGRP_BRANDING_ENABLED: "false",
    },
  },
});
