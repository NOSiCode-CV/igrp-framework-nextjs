/**
 * Post-build contract on the emitted declarations.
 *
 * `tsc --emitDeclarationOnly` copies module specifiers into `dist/*.d.ts`
 * VERBATIM, and this package is `"type": "module"`. An extensionless relative
 * specifier is therefore unresolvable for any consumer on
 * `moduleResolution: "node16" | "nodenext"` — and it fails *silently*, because
 * the resulting TS2835 is raised inside a `.d.ts` and the near-universal
 * `skipLibCheck: true` suppresses it. Every type this package exports then
 * degrades to `any`, with no diagnostic anywhere.
 *
 * This is not hypothetical here. Before this gate existed, ALL 169 relative
 * specifiers in the emitted `dist/index.d.ts` were extensionless, so the
 * package's entire public type surface was `any` for a `nodenext` consumer.
 * Demonstrated on the real build, with `skipLibCheck: true`:
 *
 *   import { IGRPButton } from "@igrp/igrp-framework-react-design-system";
 *   IGRPButton({ totallyMadeUpProp: 12345 });   // tsc exited 0
 *
 * The same probe under `moduleResolution: "bundler"` correctly raised TS2353 —
 * which is exactly why this survived review: every in-repo consumer
 * (`templates/demo-v1`) uses `bundler`, which accepts both spellings, so the
 * defect is invisible right up to the point an external consumer installs the
 * package.
 *
 * Note this covers a DIFFERENT half of the build from
 * `scripts/babel-plugin-add-import-extension.cjs`, which fixes the specifiers
 * in the emitted `.js` only. `tsc` has no equivalent, so the `.js` output was
 * correct while the declarations beside it were not — which is how the package
 * loaded fine while only its *types* were broken.
 *
 * The fix belongs at the source import (`../../lib/colors.js`), not here — the
 * Babel plugin is idempotent for already-extensioned specifiers, so one
 * spelling in `src/` satisfies both emitters.
 *
 * Kept byte-identical in intent to the sibling gates in
 * `packages/framework/next-ui` and `packages/framework/next`; if you change the
 * rule here, change it there too.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');

if (!existsSync(distDir)) {
  console.error('\n[check-dist] dist/ does not exist — run this after the build.\n');
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
/** Non-JS assets are legitimately spelled with their own extension. */
const ASSET = /\.(css|json|svg|png|jpe?g|gif|webp|woff2?)$/i;

const offenders = [];
let checked = 0;

for (const file of declarationFiles(distDir)) {
  checked += 1;
  const source = readFileSync(file, 'utf8');
  for (const [, specifier] of source.matchAll(SPECIFIER)) {
    if (!specifier.endsWith('.js') && !ASSET.test(specifier)) {
      offenders.push({ file: relative(root, file).split(sep).join('/'), specifier });
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
      offenders
        .slice(0, 40)
        .map(({ file, specifier }) => `  - ${file}: '${specifier}'`)
        .join('\n') +
      (offenders.length > 40 ? `\n  ... and ${offenders.length - 40} more` : '') +
      "\n\n  These declarations are unresolvable under moduleResolution 'node16'/'nodenext'," +
      '\n  and skipLibCheck hides the error while every exported type becomes `any`.' +
      "\n  Add the extension at the SOURCE import (e.g. '../../lib/colors.js').\n",
  );
  process.exit(1);
}

console.log(
  `[check-dist] ok — ${checked} declaration file(s), every relative specifier carries a '.js' extension.`,
);
