/**
 * Two checks the TypeScript contract gate cannot make.
 *
 * 1. BARREL COVERAGE — a type exported from a module under `src/types/` but
 *    missing from `src/index.ts` still compiles everywhere inside the package;
 *    only a consumer discovers it cannot name the thing.
 *    `IGRPRoleDepartmentArgs` sat like that — the element type of the
 *    *required* `IGRPMenuItemArgs.roles`, reachable only as
 *    `IGRPMenuItemArgs['roles'][number]`.
 *
 * 2. README COVERAGE — the README's export table is the only description of
 *    this package a consumer reads, and it has drifted twice:
 *    `IGRPMenuTypeSyncable` / `IGRPApplicationTypeSyncable` shipped as public
 *    surface and were never listed. Nothing else checks a document.
 *
 *    Matched against the table rows specifically, not the whole file: a name
 *    mentioned anywhere in the prose would otherwise count as "documented"
 *    while the table stayed stale. Checked both ways, so a row naming a type
 *    that no longer exists fails too.
 *
 * Deliberately a regex over source rather than a TS program: the barrel is a
 * flat list of `export type { ... } from './types/x.js'`, so there is nothing
 * to resolve, and this stays a dependency-free step in front of `tsc -b`.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const typesDir = join(root, 'src', 'types');

const barrel = readFileSync(join(root, 'src', 'index.ts'), 'utf8');
/** Every identifier the barrel mentions inside an `export type { ... }` block. */
const reExported = new Set(
  [...barrel.matchAll(/export\s+type\s*\{([^}]*)\}/g)].flatMap(([, names]) =>
    names
      .split(',')
      .map((name) =>
        // `Foo as Bar` re-exports under `Bar` — that is the public name.
        name
          .trim()
          .split(/\s+as\s+/)
          .pop()
          .trim(),
      )
      .filter(Boolean),
  ),
);

/** Recurse: a type nested one directory deeper is still public surface. */
function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) yield full;
  }
}

const declared = [];
for (const file of sourceFiles(typesDir)) {
  const source = readFileSync(file, 'utf8');
  // `export interface`, `export type`, `export declare` — and `export { type X }`.
  for (const [, name] of source.matchAll(
    /^export\s+(?:declare\s+)?(?:interface|type|enum)\s+([A-Za-z0-9_$]+)/gm,
  )) {
    declared.push({ name, file: relative(root, file).replaceAll('\\', '/') });
  }
}

const problems = [];

const missingFromBarrel = declared.filter(({ name }) => !reExported.has(name));
if (missingFromBarrel.length > 0) {
  problems.push(
    `${missingFromBarrel.length} type(s) exported from a module but missing from src/index.ts:\n` +
      missingFromBarrel.map(({ name, file }) => `  - ${name}  (${file})`).join('\n') +
      '\n  Add them to the barrel, or stop exporting them from the module.',
  );
}

const readme = readFileSync(join(root, 'README.md'), 'utf8');
// Table rows only: a Markdown line starting with `|` that is not the header
// separator. Names are the backticked identifiers inside those rows.
const tableRows = readme
  .split(/\r?\n/)
  .filter((line) => line.trimStart().startsWith('|') && !/^\s*\|[\s|:-]*\|?\s*$/.test(line));
const documented = new Set(
  tableRows.flatMap((row) => [...row.matchAll(/`([A-Za-z0-9_$]+)`/g)].map(([, name]) => name)),
);

const missingFromReadme = [...reExported].filter((name) => !documented.has(name));
if (missingFromReadme.length > 0) {
  problems.push(
    `${missingFromReadme.length} exported type(s) missing from the README export table:\n` +
      missingFromReadme.map((name) => `  - ${name}`).join('\n') +
      '\n  Add them to the table in README.md — it is the only export list a consumer reads.',
  );
}

// Reverse: a row naming something this package no longer exports. Restricted to
// names that look like ours, so unrelated identifiers in the table are ignored.
const staleInReadme = [...documented].filter(
  (name) => name.startsWith('IGRP') && !reExported.has(name),
);
if (staleInReadme.length > 0) {
  problems.push(
    `${staleInReadme.length} README table entr(ies) name a type this package does not export:\n` +
      staleInReadme.map((name) => `  - ${name}`).join('\n') +
      '\n  Remove them from README.md, or re-export them from src/index.ts.',
  );
}

if (problems.length > 0) {
  console.error(`\n[check-barrel] ${problems.join('\n\n[check-barrel] ')}\n`);
  process.exit(1);
}

console.log(
  `[check-barrel] ok — ${reExported.size} names re-exported, all declared types covered, all listed in the README.`,
);
