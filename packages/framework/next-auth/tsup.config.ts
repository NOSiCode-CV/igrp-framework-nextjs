import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'tsup';

/**
 * Entries that must ship a `"use client"` directive.
 *
 * esbuild drops unrecognised top-level directives from bundled output, so the
 * `'use client'` at the top of `src/client.ts` does not survive on its own —
 * and `next-auth`'s own CJS `react` entry has never carried one. Without the
 * directive, `@igrp/framework-next-auth/client` is a server-first module and
 * importing `SessionProvider` / `useSafeSession` from a file that isn't
 * already a client component fails at render. Re-add it after the bundle is
 * written; `clean: true` means this always runs against fresh output.
 *
 * EXPECTED BUILD WARNING — this is not a failure:
 *
 *   dist/client.js (1:0): Module level directives cause errors when bundled,
 *   "use client" in "dist/client.js" was ignored.
 *
 * That is the bundler announcing the very strip this hook repairs. It is
 * emitted during the ESM phase, before `onSuccess` runs, so it describes an
 * intermediate state, not the shipped file. The directive IS present in the
 * final `dist/client.js`, and `src/__tests__/dist-contract.test.ts` asserts it
 * on every build — that test, not the absence of this warning, is the signal
 * to trust.
 */
const CLIENT_ENTRIES = ['client.js'];

async function ensureUseClientDirective() {
  for (const file of CLIENT_ENTRIES) {
    const target = path.join('dist', file);
    const source = await readFile(target, 'utf8');
    if (source.startsWith('"use client"') || source.startsWith("'use client'")) continue;
    await writeFile(target, `"use client";\n${source}`, 'utf8');
  }
}

export default defineConfig({
  onSuccess: ensureUseClientDirective,
  entry: {
    index: 'src/index.ts',
    client: 'src/client.ts',
    server: 'src/server.ts',
    session: 'src/session.ts',
    jwt: 'src/jwt.ts',
    middleware: 'src/middleware.ts',
    config: 'src/config.ts',
    oidc: 'src/oidc.ts',
    providers: 'src/providers.ts',
    sanitize: 'src/sanitize.ts',
    types: 'src/types.ts',
    claims: 'src/claims.ts',
    cookies: 'src/cookies.ts',
    runtime: 'src/runtime.ts',
  },
  format: ['esm'],
  dts: {
    compilerOptions: {
      // tsconfig.json is type-check-only (noEmit, non-composite). The dts pass
      // reads it, so both have to be overridden here or the build silently
      // ships no .d.ts at all — `dist-contract.test.ts` is what catches that.
      noEmit: false,
      composite: false,
      incremental: false,
      ignoreDeprecations: '6.0',
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2022',
  platform: 'neutral',
  skipNodeModulesBundle: true,
  external: [
    'react',
    'next',
    'next/server',
    'next/headers',
    'next/navigation',
    'next-auth',
    'next-auth/react',
    'next-auth/middleware',
    'next-auth/jwt',
    'next-auth/providers/oauth',
    'next-auth/providers/keycloak',
  ],
});
