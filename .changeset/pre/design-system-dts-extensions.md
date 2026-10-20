---
'@igrp/igrp-framework-react-design-system': patch
---

Fix the public type surface for `node16`/`nodenext` consumers, and gate it.

Every relative specifier in the emitted declarations was extensionless — all 169
of them in `dist/index.d.ts`, 333 across the package. The package is
`"type": "module"`, so under `moduleResolution: "node16" | "nodenext"` those
declarations are unresolvable, and `skipLibCheck: true` (near-universal) hides
the resulting TS2835 while **every exported type silently degrades to `any`**.
Measured on the real build, with `skipLibCheck: true`:

```ts
import { IGRPButton } from '@igrp/igrp-framework-react-design-system';
IGRPButton({ totallyMadeUpProp: 12345 });   // tsc exited 0
```

The same probe under `moduleResolution: "bundler"` correctly raised TS2353,
which is why this survived review: `templates/demo-v1` uses `bundler`, so the
defect was invisible in-repo and only reached external consumers.

The 786 source specifiers now carry `.js` (the spelling `next-ui`, `next` and
`next-types` already used), so `tsc` emits resolvable declarations and the
existing Babel extension plugin — idempotent for already-extensioned
specifiers — keeps producing the same `.js` output as before.

Three gates close behind it:

- `check:dist` (new, mirroring the sibling packages) runs in `build` and fails
  on any extensionless relative specifier in `dist/*.d.ts`.
- `build-pipeline.test.ts`'s "emits fully specified relative specifiers"
  assertion **was matching nothing**: the pattern had lost its backslashes
  (`/froms+"(.[^"]*)"/`), so it searched for the literal text `froms`, collected
  zero specifiers and passed unconditionally. Repaired, and it now also asserts
  it inspected something, so it can no longer pass vacuously.
- `release` now runs `lint`, `typecheck` and `test` before publishing. This was
  the only package in the repo with a test suite *and* an ESLint config that
  gated on neither, and it had no `typecheck` script at all — so root
  `pnpm -r run typecheck` silently skipped it.

No runtime or API change: `dist/*.js` is byte-equivalent in behaviour.
