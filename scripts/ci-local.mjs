#!/usr/bin/env node
// Runs the verify-stage jobs of .gitlab-ci.yml on this machine, in the same
// order and with the same commands, so a push does not discover what a local
// run could have. Keep each job's commands in step with .gitlab-ci.yml.
//
//   pnpm ci:local                       every job
//   pnpm ci:local -- --only=verify,e2e  just those
//   pnpm ci:local -- --skip=storybook   all but those
//   pnpm ci:local -- --install          `pnpm install --frozen-lockfile` first, as CI does
//
// Not run: build_storybook_image and deploy_storybook. They push an image and
// redeploy a server; they are deployments, not checks.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const listArg = (name) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1].split(',').filter(Boolean);
const only = listArg('only');
const skip = listArg('skip') ?? [];
const isWindows = process.platform === 'win32';

function run(command, env = {}) {
  console.log(`\n$ ${command}`);
  const result = spawnSync(command, {
    cwd: root,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) throw new Error(`exited ${result.status ?? result.signal}: ${command}`);
}

/** Whether Playwright's bundled Chromium (headless shell) is installed. */
function hasPlaywrightChromium() {
  try {
    const require = createRequire(path.join(root, 'packages/e2e/package.json'));
    const { chromium } = require('playwright');
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}

async function waitFor(url, attempts = 60, delayMs = 5000) {
  for (let i = 0; i < attempts; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`${url} did not come up`);
}

function killTree(child) {
  if (!child.pid) return;
  if (isWindows) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else process.kill(-child.pid, 'SIGTERM');
}

const FRAMEWORK = '--filter "@igrp/framework-next..." --filter @igrp/framework-next-i18n';

const jobs = {
  // check_template_drift
  drift: () => {
    run('pnpm --filter @igrp/template-migrator typecheck');
    run('pnpm --filter @igrp/template-migrator test');
    run('pnpm --filter @igrp/template-migrator check:drift');
  },
  // check_skills_lock
  skills: () => {
    run('node --test scripts/skill-hash.test.mjs');
    run('node scripts/sync-claude-skills.mjs --verify-lock');
  },
  // check_i18n
  i18n: () => {
    run('pnpm --filter @igrp/framework-next-i18n test');
    run('pnpm --filter @igrp/framework-next-i18n build');
    // Re-link, as CI does: on a fresh clone the `igrp-i18n` bin target
    // (dist/cli.js) did not exist at install time, so pnpm skipped the shim.
    run(
      'pnpm install --frozen-lockfile --ignore-scripts --prefer-offline --filter @igrp/framework-next-i18n --filter @igrp/framework-next-template',
    );
    run('pnpm --filter @igrp/framework-next-template lint:i18n');
    run('pnpm lint:i18n:framework');
  },
  // verify_framework
  verify: () => {
    run('pnpm build:framework');
    run(`pnpm ${FRAMEWORK} run typecheck`);
    run(`pnpm ${FRAMEWORK} run lint`);
    run(`pnpm ${FRAMEWORK} run test --coverage --coverage.reporter=text-summary`);
    run('pnpm --filter @igrp/framework-next-template test --coverage --coverage.reporter=text-summary');
  },
  // test_e2e — CI's image ships Playwright's Chromium; locally fall back to an
  // installed browser channel when it is missing (see packages/e2e).
  e2e: () => {
    const env =
      process.env.E2E_CHANNEL || hasPlaywrightChromium()
        ? {}
        : { E2E_CHANNEL: isWindows ? 'msedge' : 'chrome' };
    if (env.E2E_CHANNEL) console.log(`Playwright Chromium not installed — using E2E_CHANNEL=${env.E2E_CHANNEL}`);
    run('pnpm build:framework');
    run('pnpm test:e2e', env);
  },
  // test_storybook
  storybook: async () => {
    if (!hasPlaywrightChromium()) {
      throw new Error(
        'Playwright Chromium is not installed; the Storybook test runner needs it. Run once: pnpm --filter @igrp/e2e exec playwright install chromium',
      );
    }
    run('pnpm --filter @igrp/igrp-framework-react-design-system build');
    run('pnpm --filter @igrp/igrp-framework-react-design-system-storybook build-storybook');
    console.log('\n$ pnpm --filter @igrp/igrp-framework-react-design-system-storybook serve-storybook &');
    const storybook = spawn('pnpm --filter @igrp/igrp-framework-react-design-system-storybook serve-storybook', {
      cwd: root,
      shell: true,
      stdio: 'ignore',
      detached: !isWindows,
    });
    try {
      await waitFor('http://localhost:6006');
      run('pnpm --filter @igrp/igrp-framework-react-design-system-storybook test-storybook:ci');
    } finally {
      killTree(storybook);
    }
  },
};

const selected = Object.keys(jobs).filter((name) => (!only || only.includes(name)) && !skip.includes(name));
const unknown = [...(only ?? []), ...skip].filter((name) => !(name in jobs));
if (unknown.length) {
  console.error(`Unknown job(s): ${unknown.join(', ')}. Jobs: ${Object.keys(jobs).join(', ')}`);
  process.exit(2);
}

if (args.includes('--install')) run('pnpm install --frozen-lockfile');

const results = [];
for (const name of selected) {
  const started = Date.now();
  try {
    await jobs[name]();
    results.push([name, 'PASS', Date.now() - started]);
  } catch (error) {
    results.push([name, 'FAIL', Date.now() - started, error.message]);
  }
}

console.log('\n── local CI ──');
for (const [name, status, elapsedMs, message] of results) {
  const seconds = Math.round(elapsedMs / 1000);
  console.log(`${status}  ${name.padEnd(10)} ${String(seconds).padStart(4)}s${message ? `  ${message}` : ''}`);
}
process.exit(results.some(([, status]) => status === 'FAIL') ? 1 : 0);
