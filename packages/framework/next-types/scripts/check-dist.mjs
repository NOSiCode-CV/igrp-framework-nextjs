/**
 * Post-build contract on the emitted declarations.
 *
 * `tsc` copies module specifiers into `dist/*.d.ts` verbatim, and this package
 * is `"type": "module"`. An extensionless relative specifier is therefore
 * unresolvable for any consumer on `moduleResolution: "node16" | "nodenext"` —
 * and it fails *silently*, because the resulting TS2834 is raised inside a
 * `.d.ts` and the near-universal `skipLibCheck: true` suppresses it. Every type
 * this package exports then degrades to `any` with no diagnostic anywhere.
 *
 * Nothing else catches that. `tsc -b` accepts both forms under
 * `moduleResolution: "bundler"`, the contract gate type-checks sources rather
 * than output, and every in-repo consumer uses `bundler` resolution — so the
 * regression is invisible right up to the point a consumer installs the
 * package. Verified by dropping one extension and running the whole pipeline:
 * `check:barrel`, `check:contract` and `tsc -b` all passed and the broken
 * declaration shipped.
 *
 * Runs after `tsc -b`, against what actually ships.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');

if (!existsSync(distDir)) {
  console.error('\n[check-dist] dist/ does not exist — run this after `tsc -b`.\n');
  process.exit(1);
}

function* declarationFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* declarationFiles(full);
    else if (entry.name.endsWith('.d.ts')) yield full;
  }
}

/** `from './x'` / `import('./x')` — the specifier text `tsc` emitted. */
const SPECIFIER = /(?:from|import)\s*\(?\s*['"](\.[^'"]*)['"]/g;

const offenders = [];
let checked = 0;

for (const file of declarationFiles(distDir)) {
  checked += 1;
  const source = readFileSync(file, 'utf8');
  for (const [, specifier] of source.matchAll(SPECIFIER)) {
    if (!specifier.endsWith('.js')) {
      offenders.push({ file: relative(root, file).replaceAll('\\', '/'), specifier });
    }
  }
}

if (checked === 0) {
  console.error('\n[check-dist] no .d.ts files found in dist/ — the build emitted nothing.\n');
  process.exit(1);
}

if (offenders.length > 0) {
  console.error(
    `\n[check-dist] ${offenders.length} relative specifier(s) in dist/ lack a '.js' extension:\n` +
      offenders.map(({ file, specifier }) => `  - ${file}: '${specifier}'`).join('\n') +
      "\n\n  These declarations are unresolvable under moduleResolution 'node16'/'nodenext'," +
      '\n  and skipLibCheck hides the error while every exported type becomes `any`.' +
      "\n  Add the extension at the source import (e.g. './types/header.js').\n",
  );
  process.exit(1);
}

console.log(
  `[check-dist] ok — ${checked} declaration file(s), every relative specifier carries a '.js' extension.`,
);
