import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import pkg from '../../package.json' with { type: 'json' };

/**
 * Contract tests for the BUILT output.
 *
 * Every other suite here reads `src/`. These read `dist/`, because several of
 * this package's load-bearing properties exist only after bundling and are
 * therefore invisible to source review and to every other test:
 *
 * - `"use client"` on the client entry is re-added by a tsup `onSuccess` hook,
 *   because esbuild strips top-level directives. Source has the directive; only
 *   the build proves it survived.
 * - The Edge-safety contract is about what `dist/config.js` STATICALLY imports.
 *   `await import('next-auth')` and `import ... from 'next-auth'` look similar
 *   in source and are completely different in the bundle.
 * - The root barrel's purity is a property of the emitted chunk.
 * - `splitting: false` means shared module state is inlined per entry, so the
 *   `Symbol.for` namespace has to match across chunks for the slots in
 *   `_global-state` to actually be shared.
 *
 * Two real regressions reached a green build before this existed: a stripped
 * `"use client"` directive, and per-chunk copies of the discovery cache and the
 * in-flight refresh map. Both were found by grepping `dist/` by hand.
 *
 * Skipped when `dist/` is absent so `pnpm test` works on a fresh clone; the
 * `release` script builds first, so it runs for real before publishing.
 */
const DIST = join(__dirname, '../../dist');
const hasDist = existsSync(DIST);

function read(file: string): string {
  return readFileSync(join(DIST, file), 'utf8');
}

/** Static ESM import specifiers, ignoring `await import(...)`. */
function staticImports(file: string): string[] {
  const source = read(file);
  const specifiers = new Set<string>();
  for (const match of source.matchAll(
    /(?:^|\n)\s*(?:import|export)[^;]*?from\s*['"]([^'"]+)['"]/g,
  )) {
    specifiers.add(match[1]);
  }
  for (const match of source.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)) {
    specifiers.add(match[1]);
  }
  return [...specifiers].filter((s) => !s.startsWith('.'));
}

const subpaths = Object.entries(pkg.exports).filter(
  (entry): entry is [string, { types: string; import: string }] =>
    typeof entry[1] === 'object' && entry[1] !== null && 'import' in entry[1],
);

describe.skipIf(!hasDist)('dist contract', () => {
  it('ships every file the exports map promises', () => {
    const missing: string[] = [];
    for (const [subpath, target] of subpaths) {
      for (const file of [target.import, target.types]) {
        if (!existsSync(join(DIST, '..', file))) missing.push(`${subpath} -> ${file}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('ships every file listed in package.json "files"', () => {
    const root = join(__dirname, '../..');
    const missing = pkg.files.filter((entry) => !existsSync(join(root, entry)));
    expect(missing).toEqual([]);
  });

  it('keeps the "use client" directive on the client entry', () => {
    // esbuild strips it; tsup's onSuccess hook puts it back. If that hook
    // breaks, `/client` silently stops being a client boundary and only fails
    // in a consumer's app.
    const first = read('client.js').trimStart().split('\n')[0].trim();
    expect(first).toMatch(/^["']use client["'];?$/);
  });

  it('keeps the root barrel free of runtime dependencies', () => {
    // A single root import from a page must not drag in next-auth/middleware,
    // next-auth/jwt or the OIDC client.
    expect(staticImports('index.js')).toEqual([]);
  });

  it('keeps the heavy next-auth package out of the Edge-reachable entries', () => {
    // `next-auth` transitively requires openid-client, which cannot execute in
    // Edge. config.js reaches it only through `await import()`, which webpack
    // puts in a lazy chunk the middleware bundle never loads.
    for (const entry of ['config.js', 'middleware.js', 'cookies.js', 'runtime.js', 'claims.js']) {
      const imports = staticImports(entry);
      expect(imports, `${entry} statically imports the next-auth main package`).not.toContain(
        'next-auth',
      );
      expect(imports, `${entry} statically imports next/headers`).not.toContain('next/headers');
    }
  });

  it('allows the Node-only server entry to import next-auth directly', () => {
    expect(staticImports('server.js')).toContain('next-auth');
  });

  it('keeps the pure modules dependency-free', () => {
    // These are the entries `@igrp/framework-next` and the browser share.
    for (const entry of [
      'claims.js',
      'cookies.js',
      'runtime.js',
      'sanitize.js',
      'providers.js',
      'session.js',
    ]) {
      expect(staticImports(entry), `${entry} gained an external dependency`).toEqual([]);
    }
  });

  it('uses one Symbol.for namespace across chunks, so global slots are shared', () => {
    // splitting:false inlines _global-state into every entry that imports it.
    // The slots are only process-wide if each copy computes the same symbol.
    const namespaces = new Set<string>();
    for (const entry of ['config.js', 'oidc.js', 'providers.js']) {
      const match = read(entry).match(/["'`](igrp\.next-auth\.)/);
      expect(match, `${entry} has no global-state namespace`).not.toBeNull();
      namespaces.add(match![1]);
    }
    expect(namespaces.size).toBe(1);
  });
});

describe.skipIf(hasDist)('dist contract (skipped)', () => {
  it('reports why it did not run', () => {
    // Visible in the report rather than silently absent.
    expect(hasDist).toBe(false);
    console.warn('[dist-contract] dist/ not built — run `pnpm build` to exercise these checks.');
  });
});
