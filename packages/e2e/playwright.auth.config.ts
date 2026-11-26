import { defineConfig } from "playwright/test";

import base from "./playwright.config";

// demo-v1 with preview mode OFF, for the middleware's login redirect and the
// login round-trip up to the IdP. The issuer is a stub that only serves OIDC
// discovery (tests-auth/stub-issuer.mjs): NextAuth needs it to build the
// authorize URL, and the tests stop at that URL without requesting it. Runs
// after the preview suite (see package.json), never alongside it: both
// `next dev` servers would share the template's `.next` directory.
const PORT = Number(process.env.E2E_AUTH_PORT ?? 3101);
const ISSUER_PORT = Number(process.env.E2E_ISSUER_PORT ?? 3109);
export const BASE_PATH = "/apps/template";
export const AUTH_ORIGIN = `http://localhost:${PORT}`;
export const AUTH_ISSUER = `http://127.0.0.1:${ISSUER_PORT}`;

// E2E_NEXTAUTH_URL replays a wrong value (`test:auth:misconfig`); the suite
// must go red on it.
const NEXTAUTH_URL = process.env.E2E_NEXTAUTH_URL ?? `${AUTH_ORIGIN}${BASE_PATH}/api/auth`;

export default defineConfig({
  ...base,
  testDir: "./tests-auth",
  outputDir: "./test-results-auth",
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: "results/junit-auth.xml" }]]
    : "list",
  use: { ...base.use, baseURL: `${AUTH_ORIGIN}${BASE_PATH}/` },
  webServer: [
    {
      command: `node tests-auth/stub-issuer.mjs ${ISSUER_PORT}`,
      url: `${AUTH_ISSUER}/.well-known/openid-configuration`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm --filter @igrp/framework-next-template dev --port ${PORT}`,
      url: `${AUTH_ORIGIN}${BASE_PATH}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        IGRP_PREVIEW_MODE: "false",
        AUTH_PROVIDER: "igrp-auth",
        IGRP_AUTH_CLIENT_ID: "e2e",
        IGRP_AUTH_CLIENT_SECRET: "e2e",
        IGRP_AUTH_ISSUER: AUTH_ISSUER,
        NEXTAUTH_SECRET: "e2e-only-not-a-secret",
        NEXT_PUBLIC_BASE_PATH: BASE_PATH,
        NEXTAUTH_URL,
        IGRP_SYNC_ACCESS: "false",
        IGRP_BRANDING_ENABLED: "false",
      },
    },
  ],
});
