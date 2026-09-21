/**
 * Fails the build when a type is exported from a module under `src/types/`
 * but not re-exported from `src/index.ts`.
 *
 * This is the one defect class the TypeScript contract gate cannot see: a type
 * that is missing from the barrel still compiles everywhere inside the
 * package, and only a consumer discovers it cannot name the thing.
 * `IGRPRoleDepartmentArgs` sat like that — the element type of the *required*
 * `IGRPMenuItemArgs.roles`, reachable only as `IGRPMenuItemArgs['roles'][number]`.
 *
 * Deliberately a regex over source rather than a TS program: the barrel is a
 * flat list of `export type { ... } from './types/x'`, so there is nothing to
 * resolve, and this stays a dependency-free step in front of `tsc -b`.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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
        name
          .trim()
          .split(/\s+as\s+/)[0]
          .trim(),
      )
      .filter(Boolean),
  ),
);

const missing = [];
for (const file of readdirSync(typesDir).filter((f) => f.endsWith('.ts'))) {
  const source = readFileSync(join(typesDir, file), 'utf8');
  for (const [, name] of source.matchAll(/^export\s+(?:interface|type)\s+([A-Za-z0-9_]+)/gm)) {
    if (!reExported.has(name)) missing.push(`${name}  (src/types/${file})`);
  }
}

if (missing.length > 0) {
  console.error(
    `\n[check-barrel] ${missing.length} type(s) are exported from a module but missing from src/index.ts:\n` +
      missing.map((entry) => `  - ${entry}`).join('\n') +
      '\n\nAdd them to the barrel, or stop exporting them from the module.\n',
  );
  process.exit(1);
}

console.log(`[check-barrel] ok — ${reExported.size} names re-exported, none missing.`);
