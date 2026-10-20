// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * The client boundary lives on the LEAVES, not the barrel.
 *
 * With "use client" on `src/index.ts`, the whole barrel was one client module:
 * every server component importing anything from next-ui (framework-next's
 * layouts, a template page) registered the entire package as its client
 * reference, so every page shipped every template component.
 *
 * Without it, a leaf that has no directive is EVALUATED ON THE SERVER whenever
 * the barrel is imported there. So such a leaf has to be server-safe. These are
 * source-level heuristics — the real proof is a `next build` of the template —
 * but they catch the ways a new leaf silently breaks the server.
 */

const SRC = fileURLToPath(new URL('..', import.meta.url));

/** Third-party packages whose published build lacks its own "use client". */
const CLIENT_ONLY_PACKAGES_WITHOUT_DIRECTIVE: string[] = [];

function sourceModules(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceModules(full);
    if (!/\.tsx?$/.test(entry.name) || /\.(test|d)\.tsx?$/.test(entry.name)) return [];
    return [full];
  });
}

/** True when the module's directive prologue contains "use client". */
function hasUseClient(source: string): boolean {
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('//')) continue;
    if (/^\/\*.*\*\/$/.test(line)) continue;
    if (/^["']use client["'];?$/.test(line)) return true;
    if (/^["']use [a-z ]+["'];?$/.test(line)) continue;
    return false;
  }
  return false;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'])\/\/.*$/gm, '$1');
}

/** Value (non-type) imports of a package. */
function importsValueFrom(code: string, pkg: string): boolean {
  const escaped = pkg.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(`^import\\s+(?!type\\b)[^;]*?from\\s+["']${escaped}["']`, 'm').test(code);
}

const modules = sourceModules(SRC).map((file) => {
  const source = readFileSync(file, 'utf8');
  return { file: relative(SRC, file).replace(/\\/g, '/'), source, client: hasUseClient(source) };
});

describe('next-ui client boundaries', () => {
  it('the root barrel does NOT carry "use client"', () => {
    const barrel = modules.find((m) => m.file === 'index.ts');
    expect(barrel?.client).toBe(false);
  });

  it('the root barrel only re-exports', () => {
    const barrel = modules.find((m) => m.file === 'index.ts')!;
    const code = stripComments(barrel.source);
    // Every top-level statement is an `export … from` (possibly multi-line).
    const statements = code
      .split(/;|\n(?=export\b)/)
      .map((s) => s.trim())
      .filter(Boolean);
    const offenders = statements.filter(
      (s) => !/^export\s+(type\s+)?\{[\s\S]*\}\s+from\s+["'][^"']+["']$/.test(s),
    );
    expect(offenders).toEqual([]);
  });

  const serverEvaluated = modules.filter((m) => !m.client && m.file !== 'index.ts');

  it.each(serverEvaluated.map((m) => [m.file, m] as const))(
    '%s has no directive, so it must be server-safe',
    (_file, mod) => {
      const code = stripComments(mod.source);
      const problems: string[] = [];
      if (/\bcreateContext\s*\(/.test(code)) problems.push('calls createContext at module scope');
      if (/\buse[A-Z][A-Za-z0-9]*\s*\(/.test(code)) problems.push('calls a hook');
      if (/\bon[A-Z][A-Za-z]+=\{/.test(code)) problems.push('passes an event handler');
      for (const pkg of CLIENT_ONLY_PACKAGES_WITHOUT_DIRECTIVE) {
        if (importsValueFrom(code, pkg))
          problems.push(`imports ${pkg}, which has no "use client" of its own`);
      }
      expect(problems, `${mod.file}: add "use client" or remove the client-only code`).toEqual([]);
    },
  );
});
