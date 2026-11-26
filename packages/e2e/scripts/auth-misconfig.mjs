// Proves the auth suite catches the NEXTAUTH_URL mistakes behind the login
// loop: for each wrong value it must stay green on the first redirect (the
// server is up) and go red on the login chain. Manual, not in CI: each value
// costs one `next dev` start (about 1 minute).
//   pnpm --filter @igrp/e2e test:auth:misconfig
import { spawnSync } from "node:child_process";

const port = Number(process.env.E2E_AUTH_PORT ?? 3101);
const WRONG = {
  "missing basePath": `http://localhost:${port}/api/auth`,
  "missing /api/auth": `http://localhost:${port}/apps/template`,
};
const CHAIN_TEST = "login chain";

let failures = 0;
for (const [label, url] of Object.entries(WRONG)) {
  const run = spawnSync(
    "pnpm exec playwright test -c playwright.auth.config.ts --retries=0 --reporter=json",
    { shell: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env, E2E_NEXTAUTH_URL: url } },
  );
  const results = [];
  try {
    const collect = (suite) => {
      for (const spec of suite.specs ?? []) results.push({ title: spec.title, ok: spec.ok });
      for (const child of suite.suites ?? []) collect(child);
    };
    for (const suite of JSON.parse(run.stdout).suites) collect(suite);
  } catch {
    // No JSON: the run itself broke (server never started, etc.).
  }
  const red = results.filter((r) => !r.ok).map((r) => r.title);
  const ok = results.length > 1 && red.length === 1 && red[0].includes(CHAIN_TEST);
  console.log(`${ok ? "ok  " : "FAIL"} NEXTAUTH_URL=${url} (${label}): red = ${JSON.stringify(red)}`);
  if (!ok) {
    failures++;
    if (!results.length) console.log(run.stderr || run.stdout);
  }
}
process.exit(failures ? 1 : 0);
