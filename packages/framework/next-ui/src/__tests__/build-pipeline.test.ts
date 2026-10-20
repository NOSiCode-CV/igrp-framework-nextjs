import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Asserts properties that exist only in the BUILD.
 *
 * A React Compiler bailout is silent by design: `babel-plugin-react-compiler`
 * swallows per-function errors and emits the original code, so the build stays
 * green while memoization disappears. `IGRPAuthForm` lost it for an unknown
 * number of releases to a `try/catch/finally` the compiler cannot lower
 * ("Todo: (BuildHIR::lowerStatement) Handle TryStatement with a finalizer"),
 * and nothing in source review or `tsc` could see it. This test can.
 *
 * Skips when `dist/` is absent so a source-only checkout still passes; `release`
 * runs `build` before `test`, so it gates every publish.
 */
const PKG_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const DIST = join(PKG_ROOT, 'dist');
const SRC = join(PKG_ROOT, 'src');

/**
 * Both extensions on purpose. This walked `.tsx` only, which left three client
 * modules unguarded — `hooks/use-breadcrumb-overflow.ts`,
 * `hooks/use-igrp-layout-retry.ts` and `permissions/use-permissions.ts`. A hook
 * is exactly as memoizable as a component, and a bailout in one is exactly as
 * silent.
 */
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(full) && !/\.d\.ts$/.test(full) ? [full] : [];
  });
}

/** Mirrors the skip rules in `scripts/react-compiler-babel-config.cjs`. */
const USE_CLIENT = /^\s*(['"])use client\1\s*;?\s*$/m;
const CREATES_CONTEXT = /\bcreateContext\s*[<(]/;
/** A module with no component or hook has nothing for the compiler to memoize. */
const DEFINES_COMPONENT_OR_HOOK = /\b(?:export\s+)?(?:function|const)\s+(?:IGRP|use|[A-Z])/;

describe.skipIf(!existsSync(DIST))('build pipeline', () => {
  it('runs the React Compiler over every eligible client module', () => {
    const missing: string[] = [];

    for (const srcFile of walk(SRC)) {
      if (srcFile.includes('__tests__')) continue;
      const source = readFileSync(srcFile, 'utf8');
      if (!USE_CLIENT.test(source)) continue;
      if (CREATES_CONTEXT.test(source)) continue; // deliberately skipped by the config
      if (!DEFINES_COMPONENT_OR_HOOK.test(source)) continue;

      const distFile = join(DIST, relative(SRC, srcFile).replace(/\.tsx?$/, '.js'));
      if (!existsSync(distFile)) {
        missing.push(`${relative(PKG_ROOT, distFile)} (not emitted)`);
        continue;
      }
      const out = readFileSync(distFile, 'utf8');
      if (!out.includes('compiler-runtime') && !out.includes('useMemoCache')) {
        missing.push(relative(PKG_ROOT, distFile));
      }
    }

    expect(missing, `React Compiler bailed on:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('actually checks the client hooks, not just the components', () => {
    // Guards the guard: if `walk` narrows back to `.tsx`, or the heuristics stop
    // matching a hook, the assertion above would pass vacuously.
    const checked = walk(SRC)
      .filter((f) => !f.includes('__tests__'))
      .filter((f) => USE_CLIENT.test(readFileSync(f, 'utf8')))
      .filter((f) => !CREATES_CONTEXT.test(readFileSync(f, 'utf8')))
      .filter((f) => DEFINES_COMPONENT_OR_HOOK.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f).split(sep).join('/'));

    expect(checked).toEqual(
      expect.arrayContaining([
        'hooks/use-breadcrumb-overflow.ts',
        'hooks/use-igrp-layout-retry.ts',
        'permissions/use-permissions.ts',
      ]),
    );
    expect(checked.length).toBeGreaterThan(20);
  });

  it('emits tokens.css and no longer ships the removed index.css', () => {
    expect(existsSync(join(DIST, 'tokens.css'))).toBe(true);
    // `src/index.css` declared `@import 'tailwindcss'` and a base layer. It was
    // never exported or imported, and shipping it invited a second Tailwind
    // build inside a consuming app.
    expect(existsSync(join(DIST, 'index.css'))).toBe(false);
  });
});
