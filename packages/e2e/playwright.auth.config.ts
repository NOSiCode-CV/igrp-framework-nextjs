import { defineConfig } from "playwright/test";

import base from "./playwright.config";

// demo-v1 with preview mode OFF, for the middleware's login redirect. No IdP is
// contacted: an anonymous request is redirected before any provider call, so
// the provider env only has to pass validation. Runs after the preview suite
// (see package.json), never alongside it: both `next dev` servers would share
// the template's `.next` directory.
const PORT = Number(process.env.E2E_AUTH_PORT ?? 3101);
const BASE_PATH = "/apps/template";

export default defineConfig({
  ...base,
  testDir: "./tests-auth",
  outputDir: "./test-results-auth",
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: "results/junit-auth.xml" }]]
    : "list",
  use: { ...base.use, baseURL: `http://localhost:${PORT}${BASE_PATH}/` },
  webServer: {
    command: `pnpm --filter @igrp/framework-next-template dev --port ${PORT}`,
    url: `http://localhost:${PORT}${BASE_PATH}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      IGRP_PREVIEW_MODE: "false",
      AUTH_PROVIDER: "igrp-auth",
      IGRP_AUTH_CLIENT_ID: "e2e",
      IGRP_AUTH_CLIENT_SECRET: "e2e",
      // Never reached by these tests; port 9 (discard) fails fast if it were.
      IGRP_AUTH_ISSUER: "http://127.0.0.1:9",
      NEXTAUTH_SECRET: "e2e-only-not-a-secret",
      NEXT_PUBLIC_BASE_PATH: BASE_PATH,
      NEXTAUTH_URL: `http://localhost:${PORT}${BASE_PATH}/api/auth`,
      IGRP_SYNC_ACCESS: "false",
      IGRP_BRANDING_ENABLED: "false",
    },
  },
});
