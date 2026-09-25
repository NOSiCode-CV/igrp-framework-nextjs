---
'@igrp/framework-next-auth': patch
---

Add contract tests for the built output, and gate `release` on them.

Several of this package's load-bearing properties exist only after bundling, so
neither source review nor any existing test could see them:

- the `"use client"` directive on `/client`, which esbuild strips and a tsup
  `onSuccess` hook puts back;
- the Edge-safety contract, which is about what `dist/config.js` *statically*
  imports — `await import('next-auth')` and a static import look alike in source
  and are entirely different in the bundle;
- the root barrel emitting no runtime dependencies;
- one `Symbol.for` namespace across chunks, without which the shared state slots
  in `_global-state` are not actually shared.

Two regressions reached a green build before this existed — a stripped
`"use client"` directive, and per-chunk copies of the discovery cache and the
in-flight refresh map — and both were found by grepping `dist/` by hand.

`dist-contract.test.ts` also checks that every `exports` subpath and every
`files` entry actually ships. It skips when `dist/` is absent so `pnpm test`
works on a fresh clone, and `release` is now `build && test && publish`, so the
checks run against freshly built output before anything is published.
